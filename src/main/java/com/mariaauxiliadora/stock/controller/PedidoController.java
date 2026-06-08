package com.mariaauxiliadora.stock.controller;

import com.mariaauxiliadora.stock.dto.EstadoRequest;
import com.mariaauxiliadora.stock.dto.PedidoRequest;
import com.mariaauxiliadora.stock.dto.response.PedidoResponse;
import com.mariaauxiliadora.stock.service.ApiResponseMapper;
import com.mariaauxiliadora.stock.service.PedidoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para la gestión de pedidos.
 *
 * <ul>
 *   <li>{@code POST  /api/pedidos}             — Cliente registrado crea un pedido.</li>
 *   <li>{@code PATCH /api/pedidos/{id}/estado} — Admin cambia el estado del pedido.</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    private final PedidoService pedidoService;
    private final ApiResponseMapper apiResponseMapper;

    public PedidoController(PedidoService pedidoService, ApiResponseMapper apiResponseMapper) {
        this.pedidoService = pedidoService;
        this.apiResponseMapper = apiResponseMapper;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PedidoResponse>> listarPedidos() {
        return ResponseEntity.ok(apiResponseMapper.toPedidoResponseList(pedidoService.listarPedidos()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PedidoResponse> obtenerPedido(@PathVariable Long id) {
        return ResponseEntity.ok(apiResponseMapper.toPedidoResponse(pedidoService.obtenerPedido(id)));
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<PedidoResponse>> listarPedidosPorUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(apiResponseMapper.toPedidoResponseList(pedidoService.listarPedidosPorUsuario(usuarioId)));
    }

    /**
     * Crea un pedido nuevo (solo usuarios con rol CLIENTE).
     */
    @PostMapping
    public ResponseEntity<PedidoResponse> crearPedido(@Valid @RequestBody PedidoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(apiResponseMapper.toPedidoResponse(pedidoService.crearPedido(request)));
    }

    /**
     * Actualiza el estado de un pedido (solo usuarios con rol ADMIN).
     * Si el nuevo estado es ACEPTADO, el stock se descuenta automáticamente.
     */
    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PedidoResponse> cambiarEstado(
            @PathVariable Long id,
            @Valid @RequestBody EstadoRequest request) {
        return ResponseEntity.ok(apiResponseMapper.toPedidoResponse(pedidoService.cambiarEstado(id, request.getEstado())));
    }
}
