docker run -p 9990:8080 -e KEYCLOAK_USER=admin -e KEYCLOAK_PASSWORD=admin -e KEYCLOAK_IMPORT=/tmp/unified-codes.json --mount type=bind,source="$(pwd)",target=/tmp jboss/keycloak