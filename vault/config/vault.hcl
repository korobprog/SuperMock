storage "file" {
  path = "/vault/data"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1
}

api_addr = "http://0.0.0.0:8200"
cluster_addr = "https://0.0.0.0:8201"
ui = true

# Включаем движок секретов KV версии 2
path "secret/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Включаем движок секретов для Kubernetes
path "kubernetes/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}