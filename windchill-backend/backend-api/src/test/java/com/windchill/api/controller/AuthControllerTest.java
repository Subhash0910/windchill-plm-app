package com.windchill.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.windchill.api.dto.LoginRequest;
import com.windchill.api.exception.GlobalExceptionHandler;
import com.windchill.api.exception.ValidationException;
import com.windchill.api.security.JwtTokenProvider;
import com.windchill.common.enums.RoleEnum;
import com.windchill.domain.entity.User;
import com.windchill.service.user.IUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();

    @Mock IUserService userService;
    @Mock JwtTokenProvider jwtTokenProvider;
    @InjectMocks AuthController controller;

    private static final String BASE = "/api/v1/auth";
    private User alice;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
            .standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();

        alice = new User();
        alice.setUsername("alice");
        alice.setEmail("alice@example.com");
        alice.setFirstName("Alice");
        alice.setLastName("Smith");
        alice.setRole(RoleEnum.ENGINEER);
    }

    // ── POST /login ────────────────────────────────────────────────────────

    @Nested @DisplayName("POST /login")
    class Login {

        @Test @DisplayName("200 with token on valid credentials")
        void success() throws Exception {
            when(userService.authenticateUser("alice", "secret99")).thenReturn(alice);
            when(jwtTokenProvider.generateToken(alice)).thenReturn("jwt-token-abc");
            when(jwtTokenProvider.getExpirationTime()).thenReturn(86400000L);

            LoginRequest req = new LoginRequest("alice", "secret99");

            mockMvc.perform(post(BASE + "/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value("jwt-token-abc"))
                .andExpect(jsonPath("$.data.username").value("alice"))
                .andExpect(jsonPath("$.data.expiresIn").value(86400000));
        }

        @Test @DisplayName("200 calls updateLastLogin after authenticate")
        void updatesLastLogin() throws Exception {
            when(userService.authenticateUser("alice", "secret99")).thenReturn(alice);
            when(jwtTokenProvider.generateToken(alice)).thenReturn("tok");
            when(jwtTokenProvider.getExpirationTime()).thenReturn(3600L);

            LoginRequest req = new LoginRequest("alice", "secret99");

            mockMvc.perform(post(BASE + "/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk());

            verify(userService).updateLastLogin(alice.getId());
        }

        @Test @DisplayName("401 when authenticateUser returns null (invalid credentials)")
        void invalidCredentials() throws Exception {
            when(userService.authenticateUser("alice", "wrongpass")).thenReturn(null);

            LoginRequest req = new LoginRequest("alice", "wrongpass");

            mockMvc.perform(post(BASE + "/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
        }

        @Test @DisplayName("401 when service throws exception")
        void serviceThrows() throws Exception {
            when(userService.authenticateUser(anyString(), anyString()))
                .thenThrow(new RuntimeException("DB unavailable"));

            LoginRequest req = new LoginRequest("alice", "secret99");

            mockMvc.perform(post(BASE + "/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
        }

        @Test @DisplayName("400 when username is blank (@Valid)")
        void blankUsername() throws Exception {
            LoginRequest req = new LoginRequest("", "secret99");

            mockMvc.perform(post(BASE + "/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
        }

        @Test @DisplayName("400 when password is blank (@Valid)")
        void blankPassword() throws Exception {
            LoginRequest req = new LoginRequest("alice", "");

            mockMvc.perform(post(BASE + "/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
        }

        @Test @DisplayName("400 when password too short — under 6 chars (@Size)")
        void shortPassword() throws Exception {
            LoginRequest req = new LoginRequest("alice", "abc");

            mockMvc.perform(post(BASE + "/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(mapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
        }
    }

    // ── GET /validate ──────────────────────────────────────────────────────

    @Nested @DisplayName("GET /validate")
    class ValidateToken {

        @Test @DisplayName("200 true when token is valid")
        void validToken() throws Exception {
            when(jwtTokenProvider.validateToken("good-token")).thenReturn(true);

            mockMvc.perform(get(BASE + "/validate")
                    .header("Authorization", "Bearer good-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(true));
        }

        @Test @DisplayName("200 false when token is invalid")
        void invalidToken() throws Exception {
            when(jwtTokenProvider.validateToken("bad-token")).thenReturn(false);

            mockMvc.perform(get(BASE + "/validate")
                    .header("Authorization", "Bearer bad-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(false));
        }

        @Test @DisplayName("200 false when Authorization header is missing")
        void missingHeader() throws Exception {
            mockMvc.perform(get(BASE + "/validate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data").value(false));
        }

        @Test @DisplayName("200 false when header lacks Bearer prefix")
        void noBearerPrefix() throws Exception {
            mockMvc.perform(get(BASE + "/validate")
                    .header("Authorization", "Token some-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data").value(false));
        }
    }
}
