package com.studyhub.security;

import com.studyhub.config.JwtConfig;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final JwtConfig jwtConfig;

    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("jti", UUID.randomUUID().toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtConfig.getExpirationMs()))
                .signWith(getSigningKey())
                .compact();
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractJti(String token) {
        return parseClaims(token).get("jti", String.class);
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            String username = extractUsername(token);
            return username.equals(userDetails.getUsername())
                    && !parseClaims(token).getExpiration().before(new Date());
        } catch (JwtException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    public String generatePasswordResetToken(String email) {
        return Jwts.builder()
                .subject(email)
                .claim("purpose", "password_reset")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtConfig.getResetTokenExpiryMs()))
                .signWith(getSigningKey())
                .compact();
    }

    public String validatePasswordResetToken(String token) {
        try {
            Claims claims = parseClaims(token);
            String purpose = claims.get("purpose", String.class);
            if (!"password_reset".equals(purpose)) {
                return null;
            }
            if (claims.getExpiration().before(new Date())) {
                return null;
            }
            return claims.getSubject();
        } catch (JwtException e) {
            log.warn("Invalid password reset token: {}", e.getMessage());
            return null;
        }
    }

    public String generateEmailVerificationToken(String email) {
        return Jwts.builder()
                .subject(email)
                .claim("purpose", "email_verification")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 86400000)) // 24 hours
                .signWith(getSigningKey())
                .compact();
    }

    public String validateEmailVerificationToken(String token) {
        try {
            Claims claims = parseClaims(token);
            String purpose = claims.get("purpose", String.class);
            if (!"email_verification".equals(purpose)) {
                return null;
            }
            if (claims.getExpiration().before(new Date())) {
                return null;
            }
            return claims.getSubject();
        } catch (JwtException e) {
            log.warn("Invalid email verification token: {}", e.getMessage());
            return null;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtConfig.getSecret().getBytes(StandardCharsets.UTF_8));
    }
}

