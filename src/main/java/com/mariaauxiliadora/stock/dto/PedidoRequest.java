package com.mariaauxiliadora.stock.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Payload recibido al crear un nuevo pedido (POST /api/pedidos).
 */
public class PedidoRequest {

    @NotNull
    private Long usuarioId;

    @NotEmpty
    @Valid
    private List<DetallePedidoRequest> detalles;

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }

    public List<DetallePedidoRequest> getDetalles() { return detalles; }
    public void setDetalles(List<DetallePedidoRequest> detalles) { this.detalles = detalles; }
}
