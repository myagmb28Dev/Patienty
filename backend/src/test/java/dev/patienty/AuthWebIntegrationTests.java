package dev.patienty;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest @ActiveProfiles("demo") @Testcontainers @AutoConfigureMockMvc
class AuthWebIntegrationTests {
    @Container @ServiceConnection static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");
    @Autowired MockMvc mockMvc;

    @Test void sessionLoginRequiresCsrfAndAuthenticatesSubsequentRequests() throws Exception {
        mockMvc.perform(get("/api/v1/patients")).andExpect(status().isUnauthorized());
        CsrfSession csrf=csrfSession();
        MockHttpSession session=csrf.session();
        String previousSessionId=session.getId();
        mockMvc.perform(post("/api/v1/auth/login").session(session).contentType(MediaType.APPLICATION_JSON)
                        .header("X-CSRF-TOKEN",csrf.token())
                        .content("{\"email\":\"doctor.kim@patienty.local\",\"password\":\"PatientyDemo1!\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("DOCTOR"));
        assertThat(session.getId()).isNotEqualTo(previousSessionId);
        mockMvc.perform(get("/api/v1/auth/me").session(session))
                .andExpect(status().isOk()).andExpect(jsonPath("$.email").value("doctor.kim@patienty.local"));

        String hidden="10000000-0000-0000-0000-000000000012";
        mockMvc.perform(get("/api/v1/patients/"+hidden).session(session)).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/patients/"+hidden+"/timeline").session(session)).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/patients/"+hidden+"/measurements").session(session)).andExpect(status().isNotFound());
        mockMvc.perform(post("/api/v1/patients/"+hidden+"/ai/queries").session(session)
                        .header("X-CSRF-TOKEN",csrf.token()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\":\"최근 변화 알려줘\"}")).andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v1/auth/logout").session(session).header("X-CSRF-TOKEN",csrf.token()))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/auth/me")).andExpect(status().isUnauthorized());
    }

    @Test void loginWithoutCsrfIsForbidden() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"doctor.kim@patienty.local\",\"password\":\"PatientyDemo1!\"}"))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test void invalidCredentialsReturnGenericUnauthorizedResponse() throws Exception {
        CsrfSession csrf=csrfSession();
        mockMvc.perform(post("/api/v1/auth/login").session(csrf.session()).contentType(MediaType.APPLICATION_JSON)
                        .header("X-CSRF-TOKEN",csrf.token())
                        .content("{\"email\":\"nobody@patienty.local\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.message").value("이메일 또는 비밀번호가 올바르지 않습니다."));
    }

    private CsrfSession csrfSession() throws Exception {
        var result=mockMvc.perform(get("/api/v1/auth/csrf")).andExpect(status().isOk())
                .andExpect(jsonPath("$.headerName").value("X-CSRF-TOKEN")).andReturn();
        return new CsrfSession((MockHttpSession)result.getRequest().getSession(false),
                com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(),"$.token"));
    }
    private record CsrfSession(MockHttpSession session,String token){}
}
