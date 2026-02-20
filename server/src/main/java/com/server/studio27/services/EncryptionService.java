package com.server.studio27.services;

import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EncryptionService {

    @Value("${secret.key:}")
    private String SECRET_KEY ;
  

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    public byte[] encrypt(byte[] data) throws Exception {
        SecretKey key = getKeyFromString(SECRET_KEY);

        byte[] iv = new byte[GCM_IV_LENGTH];
        SecureRandom random = new SecureRandom();
        random.nextBytes(iv);

        Cipher cipher = Cipher.getInstance(ALGORITHM);
        GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.ENCRYPT_MODE, key, parameterSpec);

        byte[] encryptedData = cipher.doFinal(data);

        byte[] encryptedWithIv = new byte[GCM_IV_LENGTH + encryptedData.length];
        System.arraycopy(iv, 0, encryptedWithIv, 0, GCM_IV_LENGTH);
        System.arraycopy(encryptedData, 0, encryptedWithIv, GCM_IV_LENGTH, encryptedData.length);

        return encryptedWithIv;
    }

    public byte[] decrypt(byte[] encryptedDataWithIv) throws Exception {
        System.out.println("Secret Key is: " + this.getSecretKey());
        
        SecretKey key = getKeyFromString(SECRET_KEY);

        byte[] iv = new byte[GCM_IV_LENGTH];
        System.arraycopy(encryptedDataWithIv, 0, iv, 0, GCM_IV_LENGTH);

        byte[] encryptedData = new byte[encryptedDataWithIv.length - GCM_IV_LENGTH];
        System.arraycopy(encryptedDataWithIv, GCM_IV_LENGTH, encryptedData, 0, encryptedData.length);

        Cipher cipher = Cipher.getInstance(ALGORITHM);
        GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.DECRYPT_MODE, key, parameterSpec);

        return cipher.doFinal(encryptedData);
    }

    private SecretKey getKeyFromString(String keyString) {
        if (keyString == null) {
            throw new IllegalArgumentException("Encryption key is null!");
        }
        byte[] decodedKey = Base64.getDecoder().decode(keyString);
        if (decodedKey.length != 32) {
            throw new IllegalArgumentException(
                    "Encryption key must be 32 bytes for AES-256, but got " + decodedKey.length);
        }
        return new SecretKeySpec(decodedKey, "AES");
    }

 
    public String getSecretKey() {
        return this.SECRET_KEY;
    }
}
