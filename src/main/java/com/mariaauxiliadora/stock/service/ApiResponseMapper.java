package com.mariaauxiliadora.stock.service;

import com.mariaauxiliadora.stock.dto.response.DetallePedidoResponse;
import com.mariaauxiliadora.stock.dto.response.PedidoResponse;
import com.mariaauxiliadora.stock.dto.response.ProductoResponse;
import com.mariaauxiliadora.stock.dto.response.UsuarioResponse;
import com.mariaauxiliadora.stock.dto.response.UsuarioResumenResponse;
import com.mariaauxiliadora.stock.entity.DetallePedido;
import com.mariaauxiliadora.stock.entity.Pedido;
import com.mariaauxiliadora.stock.entity.Producto;
import com.mariaauxiliadora.stock.entity.Usuario;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Convierte entidades del dominio en respuestas estables para la API.
 */
@Component
public class ApiResponseMapper {

    public ProductoResponse toProductoResponse(Producto producto) {
        ProductoResponse response = new ProductoResponse();
        response.setId(producto.getId());
        response.setNombre(producto.getNombre());
        response.setDescripcion(producto.getDescripcion());
        response.setPrecio(producto.getPrecio());
        response.setStockQuantity(producto.getStockQuantity());
        response.setFotos(producto.getFotos());
        response.setCaracteristicas(producto.getCaracteristicas());
        return response;
    }

    public UsuarioResumenResponse toUsuarioResumenResponse(Usuario usuario) {
        UsuarioResumenResponse response = new UsuarioResumenResponse();
        response.setId(usuario.getId());
        response.setNombre(usuario.getNombre());
        response.setApellido(usuario.getApellido());
        response.setEmail(usuario.getEmail());
        response.setTelefono(usuario.getTelefono());
        return response;
    }

    public UsuarioResponse toUsuarioResponse(Usuario usuario) {
        UsuarioResponse response = new UsuarioResponse();
        response.setId(usuario.getId());
        response.setNombre(usuario.getNombre());
        response.setApellido(usuario.getApellido());
        response.setOrganizacion(usuario.getOrganizacion());
        response.setPais(usuario.getPais());
        response.setProvincia(usuario.getProvincia());
        response.setCiudad(usuario.getCiudad());
        response.setDireccion(usuario.getDireccion());
        response.setCodigoPostal(usuario.getCodigoPostal());
        response.setEmail(usuario.getEmail());
        response.setTelefono(usuario.getTelefono());
        response.setRol(usuario.getRol());
        return response;
    }

    public DetallePedidoResponse toDetallePedidoResponse(DetallePedido detallePedido) {
        DetallePedidoResponse response = new DetallePedidoResponse();
        response.setId(detallePedido.getId());
        response.setProducto(toProductoResponse(detallePedido.getProducto()));
        response.setCantidad(detallePedido.getCantidad());
        response.setPrecioUnitario(detallePedido.getPrecioUnitario());
        response.setSubtotal(detallePedido.getSubtotal());
        return response;
    }

    public PedidoResponse toPedidoResponse(Pedido pedido) {
        PedidoResponse response = new PedidoResponse();
        response.setId(pedido.getId());
        response.setEstado(pedido.getEstado());
        response.setFecha(pedido.getFecha());
        response.setUsuario(toUsuarioResumenResponse(pedido.getUsuario()));
        response.setDetalles(pedido.getDetalles().stream()
                .map(this::toDetallePedidoResponse)
                .collect(Collectors.toList()));
        response.setTotal(pedido.getDetalles().stream()
                .map(DetallePedido::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        return response;
    }

    public List<PedidoResponse> toPedidoResponseList(List<Pedido> pedidos) {
        return pedidos.stream()
                .map(this::toPedidoResponse)
                .collect(Collectors.toList());
    }

    public List<ProductoResponse> toProductoResponseList(List<Producto> productos) {
        return productos.stream()
                .map(this::toProductoResponse)
                .collect(Collectors.toList());
    }

    public List<UsuarioResponse> toUsuarioResponseList(List<Usuario> usuarios) {
        return usuarios.stream()
                .map(this::toUsuarioResponse)
                .collect(Collectors.toList());
    }
}
