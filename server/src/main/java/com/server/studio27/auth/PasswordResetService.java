package com.server.studio27.auth;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
public class PasswordResetService {
    
    // In-memory token storage: email -> { token: hash, expiresAt: timestamp }
    private final Map<String, Map<String, Object>> resetTokens = new ConcurrentHashMap<>();
    private static final long TOKEN_EXPIRY_TIME = 30 * 60 * 1000; // 30 minuta
    private static final int TOKEN_LENGTH = 32;

    /**
     * Generiše reset token
     */
    public String generateResetToken(String email) {
        SecureRandom random = new SecureRandom();
        byte[] tokenBytes = new byte[TOKEN_LENGTH];
        random.nextBytes(tokenBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        
        Map<String, Object> tokenData = new ConcurrentHashMap<>();
        tokenData.put("token", token);
        tokenData.put("expiresAt", System.currentTimeMillis() + TOKEN_EXPIRY_TIME);
        
        resetTokens.put(email, tokenData);
        
        return token;
    }

    /**
     * Proverava da li je token validan
     */
    public boolean verifyResetToken(String email, String token) {
        Map<String, Object> tokenData = resetTokens.get(email);
        
        if (tokenData == null) {
            return false;
        }

        long expiresAt = (long) tokenData.get("expiresAt");
        String storedToken = (String) tokenData.get("token");

        // Provera isteka vremena
        if (System.currentTimeMillis() > expiresAt) {
            resetTokens.remove(email);
            return false;
        }

        return storedToken.equals(token);
    }

    /**
     * Invalidira token nakon uspešne upotrebe
     */
    public void invalidateToken(String email) {
        resetTokens.remove(email);
    }
}
