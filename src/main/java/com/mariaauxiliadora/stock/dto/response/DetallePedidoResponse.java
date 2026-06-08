package com.mariaauxiliadora.stock.dto.response;

import java.math.BigDecimal;

/**
 * Vista de una línea de detalle de pedido.
 */
public class DetallePedidoResponse {

    private Long id;
    private ProductoResponse producto;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ProductoResponse getProducto() { return producto; }
    public void setProducto(ProductoResponse producto) { this.producto = producto; }

    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }

    public BigDecimal getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(BigDecimal precioUnitario) { this.precioUnitario = precioUnitario; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
}
