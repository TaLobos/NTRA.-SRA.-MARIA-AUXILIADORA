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

    private static final String SUPER_ADMIN_EMAIL = "tomas.alberto.lobos123@gmail.com";

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
        return usuarioRepository.findByEmail(request.getEmail())
                .map(usuario -> actualizarDatosUsuarioExistente(usuario, request))
                .orElseGet(() -> crearUsuarioNuevo(request));
    }

    private Usuario crearUsuarioNuevo(UsuarioRequest request) {
        Usuario usuario = new Usuario();
        aplicarRequest(usuario, request, false);
        usuario.setRol(Usuario.Rol.CLIENTE);
        return usuarioRepository.save(usuario);
    }

    private Usuario actualizarDatosUsuarioExistente(Usuario usuario, UsuarioRequest request) {
        aplicarRequest(usuario, request, false);
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

        aplicarRequest(usuario, request, true);
        return usuarioRepository.save(usuario);
    }

    @Transactional
    public void borrarUsuario(Long id, String actorEmail) {
        Usuario usuario = obtenerUsuario(id);
        String targetEmail = usuario.getEmail() == null ? "" : usuario.getEmail().toLowerCase();
        String actor = actorEmail == null ? "" : actorEmail.toLowerCase();
        boolean actorIsSuperAdmin = SUPER_ADMIN_EMAIL.equals(actor);
        if (SUPER_ADMIN_EMAIL.equals(targetEmail)) {
            throw new OperacionNoPermitidaException("La cuenta super admin no se puede borrar.");
        }
        if (!actorIsSuperAdmin && usuario.getRol() == Usuario.Rol.ADMIN) {
            throw new OperacionNoPermitidaException("Los administradores solo pueden borrar clientes.");
        }
        usuarioRepository.delete(usuario);
    }

    private void aplicarRequest(Usuario usuario, UsuarioRequest request, boolean permiteCambiarRol) {
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
        if (permiteCambiarRol && request.getRol() != null) {
            usuario.setRol(request.getRol());
        }
    }
}
