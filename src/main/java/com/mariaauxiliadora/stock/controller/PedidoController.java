package com.mariaauxiliadora.stock.controller;

import com.mariaauxiliadora.stock.dto.EstadoRequest;
import com.mariaauxiliadora.stock.dto.PedidoRequest;
import com.mariaauxiliadora.stock.entity.Pedido;
import com.mariaauxiliadora.stock.service.PedidoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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

    public PedidoController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    /**
     * Crea un pedido nuevo (solo usuarios con rol CLIENTE).
     */
    @PostMapping
    @PreAuthorize("hasRole('CLIENTE')")
    public ResponseEntity<Pedido> crearPedido(@Valid @RequestBody PedidoRequest request) {
        Pedido pedido = pedidoService.crearPedido(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(pedido);
    }

    /**
     * Actualiza el estado de un pedido (solo usuarios con rol ADMIN).
     * Si el nuevo estado es ACEPTADO, el stock se descuenta automáticamente.
     */
    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Pedido> cambiarEstado(
            @PathVariable Long id,
            @Valid @RequestBody EstadoRequest request) {
        Pedido pedido = pedidoService.cambiarEstado(id, request.getEstado());
        return ResponseEntity.ok(pedido);
    }
}
