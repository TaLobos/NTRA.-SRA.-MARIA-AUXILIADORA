package com.mariaauxiliadora.stock.dto;

import com.mariaauxiliadora.stock.entity.Pedido;
import jakarta.validation.constraints.NotNull;

/**
 * Payload recibido para cambiar el estado de un pedido
 * (PATCH /api/pedidos/{id}/estado).
 */
public class EstadoRequest {

    @NotNull
    private Pedido.Estado estado;

    public Pedido.Estado getEstado() { return estado; }
    public void setEstado(Pedido.Estado estado) { this.estado = estado; }
}
