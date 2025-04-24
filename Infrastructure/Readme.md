# EKS Terraform Infrastructure

![Terraform](https://img.shields.io/badge/terraform-%235835CC.svg?style=for-the-badge&logo=terraform&logoColor=white)
![Kubernetes](https://img.shields.io/badge/kubernetes-%23326ce5.svg?style=for-the-badge&logo=kubernetes&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)
![Ingress Badge](https://img.shields.io/badge/Ingress-783CBD?logo=ingress&logoColor=fff&style=for-the-badge)
![Docker Badge](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=fff&style=for-the-badge)

This repository contains Terraform configuration for deploying a production-ready Amazon EKS (Elastic Kubernetes Service) cluster with all necessary networking components and IAM roles, along with Kubernetes network policies and ingress configurations.

## Architecture

This Terraform configuration creates:

- **VPC Infrastructure**:

  - Custom VPC with CIDR 10.0.0.0/16
  - 2 Public subnets in different AZs
  - 2 Private subnets in different AZs
  - Internet Gateway for public internet access
  - NAT Gateway for private subnet outbound traffic
  - Route tables for both public and private subnets

- **EKS Cluster**:

  - EKS Cluster with Kubernetes version 1.27
  - EKS Node Group with t3.medium instance types (SPOT instances)
  - Auto-scaling configuration (min: 1, desired: 2, max: 3)

- **Security**:

  - IAM roles for EKS cluster and worker nodes
  - Security groups with appropriate rules for cluster and node communication
  - OIDC provider for service account IAM role integration

- **Add-ons**:

  - AWS Load Balancer Controller via Helm

- **Kubernetes Network Configurations**:
  - Network Policies for controlling egress traffic
  - Ingress resources using AWS ALB for routing traffic to various microservices

## Prerequisites

- AWS CLI installed and configured
- Terraform installed (v1.0+)
- kubectl installed (for cluster access)
- Helm installed (v3+)

## Usage

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Configure AWS Credentials

Create a `terraform.tfvars` file with your AWS credentials:

```hcl
aws_access_key = "your-access-key"
aws_secret_access_key = "your-secret-key"
aws_region = "us-east-1"  # Change if needed
```

### 3. Review the Plan

```bash
terraform plan
```

### 4. Apply the Configuration

```bash
terraform apply
```

### 5. Access the Cluster

After successful deployment, you can configure kubectl to access your cluster:

```bash
# Save the kubeconfig output to a file
terraform output kubeconfig > ~/.kube/eks-config

# Set KUBECONFIG environment variable
export KUBECONFIG=~/.kube/eks-config

# Verify cluster access
kubectl get nodes
```

### 6. Apply the aws-auth ConfigMap

The aws-auth ConfigMap allows worker nodes to join the EKS cluster:

```bash
# Save the config map output to a file
terraform output config_map_aws_auth > aws-auth-cm.yaml

# Apply the config map
kubectl apply -f aws-auth-cm.yaml
```

### 7. Apply Kubernetes Network Configurations

Apply the Network Policy and Ingress configurations:

```bash
kubectl apply -f egress-configuration.yaml
kubectl apply -f ingress-live-location-configuration.yaml
kubectl apply -f ingress-commune-drop-configuration.yaml
```

## Infrastructure Components

### Networking

- **VPC**: Isolated network environment for the EKS cluster
- **Subnets**: Separated public and private subnets across multiple AZs for high availability
- **Internet Gateway**: Allows communication between instances in the VPC and the internet
- **NAT Gateway**: Enables instances in private subnets to access the internet while remaining private

### Security

- **Security Groups**: Control inbound and outbound traffic to cluster and nodes
- **IAM Roles and Policies**: Provide necessary permissions for the EKS cluster and nodes
- **Load Balancer Controller**: Manages AWS Elastic Load Balancers for Kubernetes services
- **Network Policies**: Control egress traffic at the pod level

### Ingress Controllers and Routing

- **AWS Application Load Balancer (ALB)**: Configured via ingress resources to route traffic to services
- **API Gateway Pattern**: Multiple path-based routing rules to direct traffic to appropriate microservices

## Kubernetes Network Configurations

### Network Policies

- **allow-stripe-egress**: Permits HTTPS egress traffic (port 443) from payment service pods to Stripe API

### Ingress Resources

- **api-gateway**: Routes traffic to multiple microservices in the Commune Drop application:

  - `/socket.io` → commune-drop-service
  - `/payment` → payment-service
  - `/order` → order-service
  - `/location` → location-service
  - `/auth` → auth-service
  - `/` (root) → commune-drop-service

- **live-api-gateway**: Routes traffic for the Live Location application:
  - `/api` → live-location-service
  - `/socket.io` → live-location-service
  - `/` (root) → live-location-frontend-service

## Outputs

The Terraform configuration provides several useful outputs:

- `eks_cluster_endpoint`: The endpoint for your Kubernetes API server
- `eks_cluster_certificate_authority`: Certificate authority data for cluster authentication
- `eks_cluster_security_group_id`: ID of the security group attached to the EKS cluster
- `eks_node_security_group_id`: ID of the security group attached to the EKS worker nodes
- `config_map_aws_auth`: YAML configuration for the aws-auth ConfigMap
- `kubeconfig`: kubectl configuration for accessing the cluster

## Customization

To customize this deployment, you can modify:

- Instance types in the node group
- Scaling parameters (min, max, desired capacity)
- Region and availability zones
- CIDR blocks for VPC and subnets
- EKS version
- Network policies to control traffic between services
- Ingress rules to modify routing behavior

## Cleanup

To destroy all resources created by this Terraform configuration:

```bash
terraform destroy
```

## Security Considerations

- The EKS API server is accessible from the internet by default
- IAM roles follow the principle of least privilege
- Worker nodes are placed in private subnets for enhanced security
- Security groups are configured to allow only necessary traffic
- Network policies restrict egress traffic from payment service pods to enhance security
- Ingress resources use ALB to properly route traffic to internal services

## Application Architecture

The configuration supports a microservices architecture with:

1. **Commune Drop Application**:

   - Auth Service
   - Payment Service
   - Order Service
   - Location Service
   - Main Application Service

2. **Live Location Application**:
   - Live Location API Service
   - Live Location Frontend Service

All services are exposed through AWS ALB Ingress Controllers configured with appropriate routing rules.
