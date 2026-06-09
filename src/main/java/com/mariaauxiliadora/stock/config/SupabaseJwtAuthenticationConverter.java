package com.mariaauxiliadora.stock.config;

import com.mariaauxiliadora.stock.entity.Usuario;
import com.mariaauxiliadora.stock.repository.UsuarioRepository;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.List;

public class SupabaseJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final UsuarioRepository usuarioRepository;

    public SupabaseJwtAuthenticationConverter(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        String principalName = (email == null || email.isBlank()) ? jwt.getSubject() : email;
        Usuario.Rol rol = resolveRole(email);

        return new JwtAuthenticationToken(
                jwt,
                List.of(new SimpleGrantedAuthority("ROLE_" + rol.name())),
                principalName
        );
    }

    private Usuario.Rol resolveRole(String email) {
        if (email == null || email.isBlank()) {
            return Usuario.Rol.CLIENTE;
        }
        return usuarioRepository.findByEmail(email)
                .map(Usuario::getRol)
                .orElse(Usuario.Rol.CLIENTE);
    }
}
