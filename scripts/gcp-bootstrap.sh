#!/usr/bin/env bash
# scripts/gcp-bootstrap.sh
#
# One-time initialization for Google Cloud so .github/workflows/deploy.yml can deploy to Cloud Run.
# Idempotent: existing resources will be skipped and not overwritten.
#
# Usage:
#   export PROJECT_ID="your-project-id"
#   export GITHUB_REPO="OWNER/REPO"        # Must match GitHub case exactly
#   bash scripts/gcp-bootstrap.sh
#
# Optional environment variables:
#   REGION (default asia-east1)   SERVICE (default travel-audio-guide-web)
#   AR_REPO (default web)         SET_GITHUB_VARIABLES=true  -> write GitHub Variables automatically via gh CLI
#
# Requirements: gcloud installed and authenticated (gcloud auth login), billing enabled on project.

set -euo pipefail

: "${PROJECT_ID:?請先 export PROJECT_ID}"
: "${GITHUB_REPO:?請先 export GITHUB_REPO=OWNER/REPO}"

REGION="${REGION:-asia-east1}"
SERVICE="${SERVICE:-travel-audio-guide-web}"
AR_REPO="${AR_REPO:-web}"
SECRET_NAME="ADMIN_TOKEN"
SECRET_VERSION="1" # Must match ADMIN_TOKEN_SECRET_VERSION in deploy.yml
RUNTIME_SA_NAME="travel-audio-guide-run"
DEPLOY_SA_NAME="github-deployer"
WIF_POOL="github-pool"
WIF_PROVIDER="github-provider"

RUNTIME_SA="${RUNTIME_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
DEPLOY_SA="${DEPLOY_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

export CLOUDSDK_CORE_PROJECT="${PROJECT_ID}"

step() { printf '\n==> %s\n' "$*"; }

# Newly created IAM resources may take a few seconds to take effect; retry on failure
retry() {
  local attempt
  for attempt in 1 2 3 4 5 6; do
    if "$@"; then
      return 0
    fi
    echo "   (第 ${attempt} 次失敗，5 秒後重試…)"
    sleep 5
  done
  return 1
}

step "0/10 前置檢查"
command -v gcloud >/dev/null || { echo "找不到 gcloud"; exit 1; }
ACTIVE_ACCOUNT="$(gcloud auth list --filter=status:ACTIVE --format='value(account)')"
[ -n "${ACTIVE_ACCOUNT}" ] || { echo "尚未登入，請先執行 gcloud auth login"; exit 1; }
PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"
echo "project=${PROJECT_ID} number=${PROJECT_NUMBER} region=${REGION} repo=${GITHUB_REPO}"

step "1/10 啟用 API"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com

step "2/10 Artifact Registry：${AR_REPO}"
if gcloud artifacts repositories describe "${AR_REPO}" --location="${REGION}" >/dev/null 2>&1; then
  echo "已存在，略過"
else
  gcloud artifacts repositories create "${AR_REPO}" \
    --repository-format=docker \
    --location="${REGION}" \
    --description="Travel Audio Guide web container images"
fi

step "3/10 Service Accounts（Runtime 與 Deploy 分離）"
for pair in "${RUNTIME_SA_NAME}|Cloud Run runtime (web)" "${DEPLOY_SA_NAME}|GitHub Actions deployer"; do
  name="${pair%%|*}"
  display="${pair#*|}"
  if gcloud iam service-accounts describe "${name}@${PROJECT_ID}.iam.gserviceaccount.com" >/dev/null 2>&1; then
    echo "${name} 已存在，略過"
  else
    gcloud iam service-accounts create "${name}" --display-name="${display}"
  fi
done

step "4/10 Secret Manager：${SECRET_NAME}（version ${SECRET_VERSION}）"
if gcloud secrets describe "${SECRET_NAME}" >/dev/null 2>&1; then
  echo "已存在，略過（不會覆蓋既有 token）"
else
  # Create via pipe: avoids writing to disk, and tr -d '\n' ensures no trailing newline
  # (token is compared against login passwords/cookie values; an extra newline causes login to always fail)
  openssl rand -hex 24 | tr -d '\n' | gcloud secrets create "${SECRET_NAME}" \
    --replication-policy=automatic \
    --data-file=-
fi

step "5/10 Runtime SA 可讀取 ${SECRET_NAME}（Deploy SA 不需要）"
retry gcloud secrets add-iam-policy-binding "${SECRET_NAME}" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/secretmanager.secretAccessor" >/dev/null

step "6/10 建立 Cloud Run service（只在不存在時，用範例 image 佔位）"
if gcloud run services describe "${SERVICE}" --region="${REGION}" >/dev/null 2>&1; then
  echo "service 已存在，略過（避免把正式 image 蓋回 hello）"
else
  # Bind pinned secret here: Cloud Run checks Runtime SA permissions during deploy,
  # exposing IAM issues during initialization (under your account) rather than in CI.
  retry gcloud run deploy "${SERVICE}" \
    --image="us-docker.pkg.dev/cloudrun/container/hello" \
    --region="${REGION}" \
    --service-account="${RUNTIME_SA}" \
    --update-secrets="ADMIN_TOKEN=${SECRET_NAME}:${SECRET_VERSION}" \
    --min-instances=0 \
    --max-instances=1 \
    --allow-unauthenticated \
    --quiet
fi

step "7/10 Deploy SA 的最小權限"
retry gcloud artifacts repositories add-iam-policy-binding "${AR_REPO}" \
  --location="${REGION}" \
  --member="serviceAccount:${DEPLOY_SA}" \
  --role="roles/artifactregistry.writer" >/dev/null

retry gcloud run services add-iam-policy-binding "${SERVICE}" \
  --region="${REGION}" \
  --member="serviceAccount:${DEPLOY_SA}" \
  --role="roles/run.developer" >/dev/null

retry gcloud iam service-accounts add-iam-policy-binding "${RUNTIME_SA}" \
  --member="serviceAccount:${DEPLOY_SA}" \
  --role="roles/iam.serviceAccountUser" >/dev/null

step "8/10 Workload Identity Pool / Provider（限定 ${GITHUB_REPO}）"
if gcloud iam workload-identity-pools describe "${WIF_POOL}" --location=global >/dev/null 2>&1; then
  echo "pool 已存在，略過"
else
  gcloud iam workload-identity-pools create "${WIF_POOL}" \
    --location=global --display-name="GitHub Actions"
fi

ATTRIBUTE_MAPPING="google.subject=assertion.sub,attribute.repository=assertion.repository"
ATTRIBUTE_CONDITION="assertion.repository=='${GITHUB_REPO}'"
if gcloud iam workload-identity-pools providers describe "${WIF_PROVIDER}" \
  --location=global --workload-identity-pool="${WIF_POOL}" >/dev/null 2>&1; then
  echo "provider 已存在，同步 attribute condition"
  gcloud iam workload-identity-pools providers update-oidc "${WIF_PROVIDER}" \
    --location=global --workload-identity-pool="${WIF_POOL}" \
    --attribute-mapping="${ATTRIBUTE_MAPPING}" \
    --attribute-condition="${ATTRIBUTE_CONDITION}"
else
  retry gcloud iam workload-identity-pools providers create-oidc "${WIF_PROVIDER}" \
    --location=global --workload-identity-pool="${WIF_POOL}" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="${ATTRIBUTE_MAPPING}" \
    --attribute-condition="${ATTRIBUTE_CONDITION}"
fi

step "9/10 只有 ${GITHUB_REPO} 能扮演 Deploy SA"
retry gcloud iam service-accounts add-iam-policy-binding "${DEPLOY_SA}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${WIF_POOL}/attribute.repository/${GITHUB_REPO}" >/dev/null

WIF_PROVIDER_NAME="$(gcloud iam workload-identity-pools providers describe "${WIF_PROVIDER}" \
  --location=global --workload-identity-pool="${WIF_POOL}" --format='value(name)')"

step "10/10 GitHub Variables（都不是秘密）"
if [ "${SET_GITHUB_VARIABLES:-false}" = "true" ] && command -v gh >/dev/null; then
  gh variable set GCP_PROJECT_ID --repo "${GITHUB_REPO}" --body "${PROJECT_ID}"
  gh variable set GCP_REGION --repo "${GITHUB_REPO}" --body "${REGION}"
  gh variable set GCP_DEPLOY_SERVICE_ACCOUNT --repo "${GITHUB_REPO}" --body "${DEPLOY_SA}"
  gh variable set GCP_WORKLOAD_IDENTITY_PROVIDER --repo "${GITHUB_REPO}" --body "${WIF_PROVIDER_NAME}"
  echo "已用 gh 寫入 4 個 GitHub Variables。"
else
  cat <<VARS
請到 GitHub：Settings → Secrets and variables → Actions → Variables，新增：

  GCP_PROJECT_ID                  = ${PROJECT_ID}
  GCP_REGION                      = ${REGION}
  GCP_DEPLOY_SERVICE_ACCOUNT      = ${DEPLOY_SA}
  GCP_WORKLOAD_IDENTITY_PROVIDER  = ${WIF_PROVIDER_NAME}

或用 gh CLI（重新執行本腳本並加上 SET_GITHUB_VARIABLES=true 亦可）。
VARS
fi

cat <<DONE

完成。下一步：
  1. 確認 4 個 GitHub Variables 已設定
  2. Merge chore/cloud-run-deploy 的 PR → CI 通過後自動部署
  3. 取得後台密碼：
       gcloud secrets versions access ${SECRET_VERSION} --secret=${SECRET_NAME}
DONE