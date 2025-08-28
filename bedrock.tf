locals {
  kb_s3_bucket_name_prefix = "forex-kb"
  kb_oss_collection_name   = "bedrock-knowledge-base-forex-kb"
  kb_model_id              = "amazon.titan-embed-text-v2:0"
  kb_name                  = "ForexKB"
}

data "aws_caller_identity" "this" {}
data "aws_partition" "this" {}
data "aws_region" "this" {}

locals {
  account_id            = data.aws_caller_identity.this.account_id
  partition             = data.aws_partition.this.partition
  region                = data.aws_region.this.name
  region_name_tokenized = split("-", local.region)
  region_short          = "${substr(local.region_name_tokenized[0], 0, 2)}${substr(local.region_name_tokenized[1], 0, 1)}${local.region_name_tokenized[2]}"
  model_dimensions      = 512
}

data "aws_bedrock_foundation_model" "this" {
  model_id = local.kb_model_id
}

// Bedrock agent setup

# Agent resource role
resource "aws_iam_role" "bedrock_agent_forex_asst" {
  name = "AmazonBedrockExecutionRoleForAgents_ForexAssistant"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "bedrock.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = local.account_id
          }
          ArnLike = {
            "aws:SourceArn" = "arn:${local.partition}:bedrock:${local.region}:${local.account_id}:agent/*"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "bedrock_agent_forex_asst" {
  name = "AmazonBedrockAgentBedrockFoundationModelPolicy_ForexAssistant"
  role = aws_iam_role.bedrock_agent_forex_asst.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = "bedrock:InvokeModel"
        Effect   = "Allow"
        Resource = data.aws_bedrock_foundation_model.this.model_arn
      }
    ]
  })
}

data "aws_iam_policy" "lambda_basic_execution" {
  name = "AWSLambdaBasicExecutionRole"
}

# Action group Lambda execution role
resource "aws_iam_role" "lambda_forex_api" {
  name = "FunctionExecutionRoleForLambda_ForexAPI"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = "${local.account_id}"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution_role_policy_attach" {
  role       = aws_iam_role.lambda_forex_api.name
  policy_arn = data.aws_iam_policy.lambda_basic_execution.arn
}

// lambda

# Action group Lambda function
data "archive_file" "forex_api_zip" {
  type             = "zip"
  source_file      = "${path.module}/index.py"
  output_path      = "${path.module}/tmp/forex_api.zip"
  output_file_mode = "0666"
}

resource "aws_lambda_function" "forex_api" {
  function_name = "ForexAPI"
  role          = aws_iam_role.lambda_forex_api.arn
  description   = "A Lambda function for the forex API action group"
  filename      = data.archive_file.forex_api_zip.output_path
  handler       = "index.lambda_handler"
  runtime       = "python3.12"
  # source_code_hash is required to detect changes to Lambda code/zip
  source_code_hash = data.archive_file.forex_api_zip.output_base64sha256
}

resource "aws_lambda_permission" "forex_api" {
  action         = "lambda:invokeFunction"
  function_name  = aws_lambda_function.forex_api.function_name
  principal      = "bedrock.amazonaws.com"
  source_account = local.account_id
  source_arn     = "arn:aws:bedrock:${local.region}:${local.account_id}:agent/*"
}

resource "aws_bedrockagent_agent" "forex_asst" {
  agent_name              = "ForexAssistant"
  agent_resource_role_arn = aws_iam_role.bedrock_agent_forex_asst.arn
  description             = "An assisant that provides forex rate information."
  foundation_model        = data.aws_bedrock_foundation_model.this.model_id
  instruction             = "You are an assistant that looks up today's currency exchange rates. A user may ask you what the currency exchange rate is for one currency to another. They may provide either the currency name or the three-letter currency code. If they give you a name, you may first need to first look up the currency code by its name."
}

resource "aws_bedrockagent_agent_action_group" "forex_api" {
  action_group_name          = "ForexAPI"
  agent_id                   = aws_bedrockagent_agent.forex_asst.id
  agent_version              = "DRAFT"
  description                = "The currency exchange rates API"
  skip_resource_in_use_check = true
  action_group_executor {
    lambda = aws_lambda_function.forex_api.arn
  }
  api_schema {
    payload = file("${path.module}/schema.yaml")
  }
}



// knowldege base setup

resource "aws_iam_role" "bedrock_kb_forex_kb" {
  name = "AmazonBedrockExecutionRoleForKnowledgeBase_${local.kb_name}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "bedrock.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = local.account_id
          }
          ArnLike = {
            "aws:SourceArn" = "arn:${local.partition}:bedrock:${local.region}:${local.account_id}:knowledge-base/*"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "bedrock_kb_forex_kb_model" {
  name = "AmazonBedrockFoundationModelPolicyForKnowledgeBase_${local.kb_name}"
  role = aws_iam_role.bedrock_kb_forex_kb.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = "bedrock:InvokeModel"
        Effect   = "Allow"
        Resource = data.aws_bedrock_foundation_model.this.model_arn
      }
    ]
  })
}

resource "aws_s3_bucket" "forex_kb" {
  bucket        = "${local.kb_s3_bucket_name_prefix}-${local.region_short}-${local.account_id}"
  force_destroy = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "forex_kb" {
  bucket = aws_s3_bucket.forex_kb.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "forex_kb" {
  bucket = aws_s3_bucket.forex_kb.id
  versioning_configuration {
    status = "Enabled"
  }
  depends_on = [aws_s3_bucket_server_side_encryption_configuration.forex_kb]
}

resource "aws_iam_role_policy" "bedrock_kb_forex_kb_s3" {
  name = "AmazonBedrockS3PolicyForKnowledgeBase_${local.kb_name}"
  role = aws_iam_role.bedrock_kb_forex_kb.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "S3ListBucketStatement"
        Action   = "s3:ListBucket"
        Effect   = "Allow"
        Resource = aws_s3_bucket.forex_kb.arn
        Condition = {
          StringEquals = {
            "aws:PrincipalAccount" = local.account_id
          }
      } },
      {
        Sid      = "S3GetObjectStatement"
        Action   = "s3:GetObject"
        Effect   = "Allow"
        Resource = "${aws_s3_bucket.forex_kb.arn}/*"
        Condition = {
          StringEquals = {
            "aws:PrincipalAccount" = local.account_id
          }
        }
      }
    ]
  })
}

resource "aws_opensearchserverless_access_policy" "forex_kb" {
  name = local.kb_oss_collection_name
  type = "data"
  policy = jsonencode([
    {
      Rules = [
        {
          ResourceType = "index"
          Resource = [
            "index/${local.kb_oss_collection_name}/*"
          ]
          Permission = [
            "aoss:CreateIndex",
            "aoss:DeleteIndex",
            "aoss:DescribeIndex",
            "aoss:ReadDocument",
            "aoss:UpdateIndex",
            "aoss:WriteDocument"
          ]
        },
        {
          ResourceType = "collection"
          Resource = [
            "collection/${local.kb_oss_collection_name}"
          ]
          Permission = [
            "aoss:CreateCollectionItems",
            "aoss:DescribeCollectionItems",
            "aoss:UpdateCollectionItems"
          ]
        }
      ],
      Principal = [
        aws_iam_role.bedrock_kb_forex_kb.arn,
        data.aws_caller_identity.this.arn
      ]
    }
  ])
}

resource "aws_opensearchserverless_security_policy" "forex_kb_encryption" {
  name = local.kb_oss_collection_name
  type = "encryption"
  policy = jsonencode({
    Rules = [
      {
        Resource = [
          "collection/${local.kb_oss_collection_name}"
        ]
        ResourceType = "collection"
      }
    ],
    AWSOwnedKey = true
  })
}

resource "aws_opensearchserverless_security_policy" "forex_kb_network" {
  name = local.kb_oss_collection_name
  type = "network"
  policy = jsonencode([
    {
      Rules = [
        {
          ResourceType = "collection"
          Resource = [
            "collection/${local.kb_oss_collection_name}"
          ]
        },
        {
          ResourceType = "dashboard"
          Resource = [
            "collection/${local.kb_oss_collection_name}"
          ]
        }
      ]
      AllowFromPublic = true
    }
  ])
}

resource "aws_opensearchserverless_collection" "forex_kb" {
  name = local.kb_oss_collection_name
  type = "VECTORSEARCH"
  depends_on = [
    aws_opensearchserverless_access_policy.forex_kb,
    aws_opensearchserverless_security_policy.forex_kb_encryption,
    aws_opensearchserverless_security_policy.forex_kb_network
  ]
}

resource "aws_iam_role_policy" "bedrock_kb_forex_kb_oss" {
  name = "AmazonBedrockOSSPolicyForKnowledgeBase_${local.kb_name}"
  role = aws_iam_role.bedrock_kb_forex_kb.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action   = "aoss:APIAccessAll"
        Effect   = "Allow"
        Resource = aws_opensearchserverless_collection.forex_kb.arn
      }
    ]
  })
}

resource "opensearch_index" "forex_kb" {
  name                           = "bedrock-knowledge-base-default-index"
  number_of_shards               = "2"
  number_of_replicas             = "0"
  index_knn                      = true
  index_knn_algo_param_ef_search = "512"
  mappings                       = <<-EOF
    {
      "properties": {
        "bedrock-knowledge-base-default-vector": {
          "type": "knn_vector",
          "dimension": ${local.model_dimensions},
          "method": {
            "name": "hnsw",
            "engine": "faiss",
            "parameters": {
              "m": 16,
              "ef_construction": 512
            },
            "space_type": "l2"
          }
        },
        "AMAZON_BEDROCK_METADATA": {
          "type": "text",
          "index": "false"
        },
        "AMAZON_BEDROCK_TEXT_CHUNK": {
          "type": "text",
          "index": "true"
        }
      }
    }
  EOF
  force_destroy                  = true
  depends_on                     = [aws_opensearchserverless_collection.forex_kb]
}

resource "time_sleep" "aws_iam_role_policy_bedrock_kb_forex_kb_oss" {
  create_duration = "20s"
  depends_on      = [aws_iam_role_policy.bedrock_kb_forex_kb_oss]
}

resource "aws_bedrockagent_knowledge_base" "forex_kb" {
  name     = local.kb_name
  role_arn = aws_iam_role.bedrock_kb_forex_kb.arn
  knowledge_base_configuration {
    vector_knowledge_base_configuration {
      embedding_model_arn = data.aws_bedrock_foundation_model.this.model_arn
      embedding_model_configuration {
        bedrock_embedding_model_configuration {
          dimensions = local.model_dimensions
        }
      }
    }
    type = "VECTOR"
  }
  storage_configuration {
    type = "OPENSEARCH_SERVERLESS"
    opensearch_serverless_configuration {
      collection_arn    = aws_opensearchserverless_collection.forex_kb.arn
      vector_index_name = "bedrock-knowledge-base-default-index"
      field_mapping {
        vector_field   = "bedrock-knowledge-base-default-vector"
        text_field     = "AMAZON_BEDROCK_TEXT_CHUNK"
        metadata_field = "AMAZON_BEDROCK_METADATA"
      }
    }
  }
  depends_on = [
    aws_iam_role_policy.bedrock_kb_forex_kb_model,
    aws_iam_role_policy.bedrock_kb_forex_kb_s3,
    opensearch_index.forex_kb,
    time_sleep.aws_iam_role_policy_bedrock_kb_forex_kb_oss
  ]
}

resource "aws_bedrockagent_data_source" "forex_kb" {
  knowledge_base_id = aws_bedrockagent_knowledge_base.forex_kb.id
  name              = "${local.kb_name}DataSource"
  data_source_configuration {
    type = "S3"
    s3_configuration {
      bucket_arn = aws_s3_bucket.forex_kb.arn
    }
  }
}

resource "aws_bedrockagent_agent_knowledge_base_association" "forex_kb" {
  agent_id             = aws_bedrockagent_agent.forex_asst.id
  description          = file("${path.module}/prompt_templates/kb_instructions.txt")
  knowledge_base_id    = aws_bedrockagent_knowledge_base.forex_kb.id
  knowledge_base_state = "ENABLED"
}

resource "null_resource" "forex_asst_prepare" {
  triggers = {
    forex_api_state = sha256(jsonencode(aws_bedrockagent_agent_action_group.forex_api))
    forex_kb_state  = sha256(jsonencode(aws_bedrockagent_knowledge_base.forex_kb))
  }
  provisioner "local-exec" {
    command = "aws bedrock-agent prepare-agent --agent-id ${aws_bedrockagent_agent.forex_asst.id} --region ${var.region}"
  }
  depends_on = [
    aws_bedrockagent_agent.forex_asst,
    aws_bedrockagent_agent_action_group.forex_api,
    aws_bedrockagent_knowledge_base.forex_kb
  ]
}









