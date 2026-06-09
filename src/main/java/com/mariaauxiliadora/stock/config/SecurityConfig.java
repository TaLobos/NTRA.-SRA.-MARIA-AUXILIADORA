package com.mariaauxiliadora.stock.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import com.mariaauxiliadora.stock.repository.UsuarioRepository;

/**
 * Configuración de Spring Security.
 *
 * <p>Acepta JWT de Supabase Auth y conserva HTTP Basic como fallback local.
 * Los roles se resuelven desde la tabla usuarios.</p>
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final CorsConfig corsConfig;
    private final String adminUsername;
    private final String adminPassword;
    private final String supabaseIssuer;
    private final String supabaseJwksUri;
    private final UsuarioRepository usuarioRepository;

    public SecurityConfig(CorsConfig corsConfig,
                          UsuarioRepository usuarioRepository,
                          @Value("${ADMIN_USERNAME:tomas.alberto.lobos123@gmail.com}") String adminUsername,
                          @Value("${ADMIN_PASSWORD:juegos13}") String adminPassword,
                          @Value("${supabase.jwt.issuer}") String supabaseIssuer,
                          @Value("${supabase.jwt.jwks-uri}") String supabaseJwksUri) {
        this.corsConfig = corsConfig;
        this.usuarioRepository = usuarioRepository;
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
        this.supabaseIssuer = supabaseIssuer;
        this.supabaseJwksUri = supabaseJwksUri;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfig.corsConfigurationSource()))
            // CSRF protection is intentionally disabled for this stateless REST API:
            // Stateless API: auth is sent through Authorization headers, not cookies.
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/productos/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/usuarios").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/pedidos").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(new SupabaseJwtAuthenticationConverter(usuarioRepository)))
            )
            .httpBasic(httpBasic -> {});

        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(supabaseJwksUri).build();
        OAuth2TokenValidator<Jwt> issuerValidator = JwtValidators.createDefaultWithIssuer(supabaseIssuer);
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(issuerValidator));
        return decoder;
    }

    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {
        return new InMemoryUserDetailsManager(User.withUsername(adminUsername)
                .password(passwordEncoder.encode(adminPassword))
                .roles("ADMIN")
                .build());
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
