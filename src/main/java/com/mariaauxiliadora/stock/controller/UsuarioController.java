package com.mariaauxiliadora.stock.controller;

import com.mariaauxiliadora.stock.dto.UsuarioRequest;
import com.mariaauxiliadora.stock.dto.response.UsuarioResponse;
import com.mariaauxiliadora.stock.service.ApiResponseMapper;
import com.mariaauxiliadora.stock.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API para registrar clientes y administrar usuarios.
 */
@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final ApiResponseMapper apiResponseMapper;

    public UsuarioController(UsuarioService usuarioService, ApiResponseMapper apiResponseMapper) {
        this.usuarioService = usuarioService;
        this.apiResponseMapper = apiResponseMapper;
    }

    @PostMapping
    public ResponseEntity<UsuarioResponse> crearCliente(@Valid @RequestBody UsuarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(apiResponseMapper.toUsuarioResponse(usuarioService.crearCliente(request)));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UsuarioResponse>> listarUsuarios() {
        return ResponseEntity.ok(apiResponseMapper.toUsuarioResponseList(usuarioService.listarUsuarios()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UsuarioResponse> obtenerUsuario(@PathVariable Long id) {
        return ResponseEntity.ok(apiResponseMapper.toUsuarioResponse(usuarioService.obtenerUsuario(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UsuarioResponse> actualizarUsuario(@PathVariable Long id,
                                                             @Valid @RequestBody UsuarioRequest request) {
        return ResponseEntity.ok(apiResponseMapper.toUsuarioResponse(usuarioService.actualizarUsuario(id, request)));
    }
}
