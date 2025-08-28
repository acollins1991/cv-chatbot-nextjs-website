# variable "bucket_name" {
#   description = "The name of the S3 bucket (without www.)"
#   type        = string
#   default = "anthony-collins.com"
# }

# resource "aws_s3_bucket_acl" "bucket-acl" {
#   bucket     = data.aws_s3_bucket.selected-bucket.id
#   acl        = "public-read"
#   depends_on = [aws_s3_bucket_ownership_controls.s3_bucket_acl_ownership]
# }

# resource "aws_s3_bucket" "bucket-1" {
#   bucket = "www.${var.bucket_name}"
# }
# data "aws_s3_bucket" "selected-bucket" {
#   bucket = aws_s3_bucket.bucket-1.bucket
# }

# resource "aws_s3_bucket_versioning" "versioning_example" {
#   bucket = data.aws_s3_bucket.selected-bucket.id
#   versioning_configuration {
#     status = "Enabled"
#   }
# }

# resource "aws_s3_bucket_ownership_controls" "s3_bucket_acl_ownership" {
#   bucket = data.aws_s3_bucket.selected-bucket.id
#   rule {
#     object_ownership = "BucketOwnerPreferred"
#   }
#   depends_on = [aws_s3_bucket_public_access_block.example]
# }

# resource "aws_s3_bucket_public_access_block" "example" {
#   bucket = data.aws_s3_bucket.selected-bucket.id

#   block_public_acls       = false
#   block_public_policy     = false
#   ignore_public_acls      = false
#   restrict_public_buckets = false
# }

# resource "aws_s3_bucket_policy" "bucket-policy" {
#   bucket = data.aws_s3_bucket.selected-bucket.id
#   policy = data.aws_iam_policy_document.iam-policy-1.json
# }
# data "aws_iam_policy_document" "iam-policy-1" {
#   statement {
#     sid    = "AllowPublicRead"
#     effect = "Allow"
#     resources = [
#       "arn:aws:s3:::www.${var.bucket_name}",
#       "arn:aws:s3:::www.${var.bucket_name}/*",
#     ]
#     actions = ["S3:GetObject"]
#     principals {
#       type        = "*"
#       identifiers = ["*"]
#     }
#   }

#   depends_on = [aws_s3_bucket_public_access_block.example]
# }

# # Website configuration
# resource "aws_s3_bucket_website_configuration" "website-config" {
#   bucket = data.aws_s3_bucket.selected-bucket.bucket
#   index_document {
#     suffix = "index.html"
#   }
#   error_document {
#     key = "404.html"
#   }
#   # IF you want to use the routing rule
#   # routing_rule {
#   #     condition {
#   #     key_prefix_equals = "/abc"
#   #     }
#   #     redirect {
#   #     replace_key_prefix_with = "comming-soon.jpeg"
#   #     }
#   # }
# }

# # Upload files to S3 bucket
# # resource "aws_s3_object" "object-upload-html" {
# #   for_each     = fileset("uploads/", "*.html")
# #   bucket       = data.aws_s3_bucket.selected-bucket.bucket
# #   key          = each.value
# #   source       = "uploads/${each.value}"
# #   content_type = "text/html"
# #   etag         = filemd5("uploads/${each.value}")
# #   acl          = "public-read"
# # }
# module "upload_to_bucket" {
#   source            = "digitickets/cli/aws"
#   aws_cli_commands  = ["s3", "sync", "./out s3://${aws_s3_bucket.bucket-1.bucket_domain_name}"]
# }