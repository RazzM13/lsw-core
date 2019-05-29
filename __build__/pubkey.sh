#!/bin/bash
keyFilename="key.pem"
pubKeyFilename="pubkey.pem"
openssl pkey -in "${keyFilename}" -outform PEM -pubout -out "${pubKeyFilename}"
openssl pkey -in "${pubKeyFilename}" -pubin -outform DER | sha512sum -b -z | awk {'print $1'} > "${pubKeyFilename}.id"
