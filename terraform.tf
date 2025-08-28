terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.93"
    }

    opensearch = {
      source  = "opensearch-project/opensearch"
      version = "2.2.0"
    }
  }

  required_version = ">= 1.5"
}

variable "region" {
  type        = string
  description = "AWS region to deploy the resources"
  default     = "eu-west-2"
}

provider "aws" {
  region = var.region
}

provider "awscc" {
  region = var.region
}

provider "opensearch" {
  url         = aws_opensearchserverless_collection.forex_kb.collection_endpoint
  healthcheck = false
}
