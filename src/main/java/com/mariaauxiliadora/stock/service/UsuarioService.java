package com.mariaauxiliadora.stock.service;

import com.mariaauxiliadora.stock.dto.UsuarioRequest;
import com.mariaauxiliadora.stock.entity.Usuario;
import com.mariaauxiliadora.stock.exception.OperacionNoPermitidaException;
import com.mariaauxiliadora.stock.exception.RecursoNoEncontradoException;
import com.mariaauxiliadora.stock.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Logica de negocio para usuarios/clientes.
 */
@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<Usuario> listarUsuarios() {
        return usuarioRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Usuario obtenerUsuario(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado: " + id));
    }

    @Transactional
    public Usuario crearCliente(UsuarioRequest request) {
        usuarioRepository.findByEmail(request.getEmail()).ifPresent(usuario -> {
            throw new OperacionNoPermitidaException("Ya existe un usuario con el email: " + request.getEmail());
        });

        Usuario usuario = new Usuario();
        aplicarRequest(usuario, request);
        usuario.setRol(Usuario.Rol.CLIENTE);
        return usuarioRepository.save(usuario);
    }

    @Transactional
    public Usuario actualizarUsuario(Long id, UsuarioRequest request) {
        Usuario usuario = obtenerUsuario(id);
        usuarioRepository.findByEmail(request.getEmail())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new OperacionNoPermitidaException("Ya existe un usuario con el email: " + request.getEmail());
                });

        aplicarRequest(usuario, request);
        return usuarioRepository.save(usuario);
    }

    private void aplicarRequest(Usuario usuario, UsuarioRequest request) {
        usuario.setNombre(request.getNombre());
        usuario.setApellido(request.getApellido());
        usuario.setOrganizacion(request.getOrganizacion());
        usuario.setPais(request.getPais());
        usuario.setProvincia(request.getProvincia());
        usuario.setCiudad(request.getCiudad());
        usuario.setDireccion(request.getDireccion());
        usuario.setCodigoPostal(request.getCodigoPostal());
        usuario.setEmail(request.getEmail());
        usuario.setTelefono(request.getTelefono());
    }
}
