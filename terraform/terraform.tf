terraform {
  backend "s3" {
    encrypt = true
    bucket = "tiago-websites-tf-state-files"
    region = "eu-west-1"
    key = "swords-and-quills.dosaki.net/terraform.tfstate"
  }
}
