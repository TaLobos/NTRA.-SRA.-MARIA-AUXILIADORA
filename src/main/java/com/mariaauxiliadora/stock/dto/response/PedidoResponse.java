package com.mariaauxiliadora.stock.dto.response;

import com.mariaauxiliadora.stock.entity.Pedido;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Respuesta estable para el detalle de un pedido.
 */
public class PedidoResponse {

    private Long id;
    private Pedido.Estado estado;
    private OffsetDateTime fecha;
    private UsuarioResumenResponse usuario;
    private List<DetallePedidoResponse> detalles;
    private BigDecimal total;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Pedido.Estado getEstado() { return estado; }
    public void setEstado(Pedido.Estado estado) { this.estado = estado; }

    public OffsetDateTime getFecha() { return fecha; }
    public void setFecha(OffsetDateTime fecha) { this.fecha = fecha; }

    public UsuarioResumenResponse getUsuario() { return usuario; }
    public void setUsuario(UsuarioResumenResponse usuario) { this.usuario = usuario; }

    public List<DetallePedidoResponse> getDetalles() { return detalles; }
    public void setDetalles(List<DetallePedidoResponse> detalles) { this.detalles = detalles; }

    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
}
