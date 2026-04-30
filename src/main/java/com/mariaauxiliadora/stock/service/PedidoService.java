package com.mariaauxiliadora.stock.service;

import com.mariaauxiliadora.stock.dto.DetallePedidoRequest;
import com.mariaauxiliadora.stock.dto.PedidoRequest;
import com.mariaauxiliadora.stock.entity.DetallePedido;
import com.mariaauxiliadora.stock.entity.Pedido;
import com.mariaauxiliadora.stock.entity.Producto;
import com.mariaauxiliadora.stock.entity.Usuario;
import com.mariaauxiliadora.stock.exception.RecursoNoEncontradoException;
import com.mariaauxiliadora.stock.exception.StockInsuficienteException;
import com.mariaauxiliadora.stock.repository.PedidoRepository;
import com.mariaauxiliadora.stock.repository.ProductoRepository;
import com.mariaauxiliadora.stock.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Lógica de negocio para la gestión de pedidos.
 */
@Service
public class PedidoService {

    private final PedidoRepository    pedidoRepository;
    private final UsuarioRepository   usuarioRepository;
    private final ProductoRepository  productoRepository;

    public PedidoService(PedidoRepository pedidoRepository,
                         UsuarioRepository usuarioRepository,
                         ProductoRepository productoRepository) {
        this.pedidoRepository   = pedidoRepository;
        this.usuarioRepository  = usuarioRepository;
        this.productoRepository = productoRepository;
    }

    // ── Crear pedido ──────────────────────────────────────────────────────────

    /**
     * Crea un nuevo pedido en estado PENDIENTE para el cliente indicado.
     * El stock NO se descuenta aún; eso ocurre cuando el Admin acepta el pedido.
     *
     * @param request datos del pedido (usuarioId + lista de detalles)
     * @return Pedido persistido
     */
    @Transactional
    public Pedido crearPedido(PedidoRequest request) {
        Usuario usuario = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Usuario no encontrado: " + request.getUsuarioId()));

        Pedido pedido = new Pedido(usuario);

        for (DetallePedidoRequest detalleReq : request.getDetalles()) {
            Producto producto = productoRepository.findById(detalleReq.getProductoId())
                    .orElseThrow(() -> new RecursoNoEncontradoException(
                            "Producto no encontrado: " + detalleReq.getProductoId()));

            pedido.addDetalle(new DetallePedido(producto, detalleReq.getCantidad()));
        }

        return pedidoRepository.save(pedido);
    }

    // ── Cambiar estado (Admin) ────────────────────────────────────────────────

    /**
     * Actualiza el estado de un pedido.
     *
     * <p>Si el nuevo estado es {@link Pedido.Estado#ACEPTADO}, se descuenta el
     * stock de cada producto involucrado de forma atómica. Si algún producto no
     * dispone de stock suficiente se lanza {@link StockInsuficienteException} y
     * la transacción completa se revierte (no se modifica nada).</p>
     *
     * @param pedidoId identificador del pedido
     * @param nuevoEstado estado al que se desea transicionar
     * @return Pedido con el estado actualizado
     */
    @Transactional
    public Pedido cambiarEstado(Long pedidoId, Pedido.Estado nuevoEstado) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Pedido no encontrado: " + pedidoId));

        if (nuevoEstado == Pedido.Estado.ACEPTADO) {
            descontarStock(pedido);
        }

        pedido.setEstado(nuevoEstado);
        return pedidoRepository.save(pedido);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Descuenta el stock de cada producto en el pedido.
     * Si alguno no tiene suficiente stock lanza {@link StockInsuficienteException}
     * y la transacción padre hace rollback completo.
     *
     * <p>Los productos son entidades gestionadas dentro de la transacción activa,
     * por lo que JPA persiste automáticamente los cambios al hacer commit; no es
     * necesario llamar a {@code save()} explícitamente en cada iteración.</p>
     */
    private void descontarStock(Pedido pedido) {
        for (DetallePedido detalle : pedido.getDetalles()) {
            Producto producto = detalle.getProducto();
            int stockActual    = producto.getStockQuantity();
            int cantidadPedida = detalle.getCantidad();

            if (stockActual < cantidadPedida) {
                throw new StockInsuficienteException(
                        String.format(
                                "Stock insuficiente para '%s': disponible=%d, solicitado=%d",
                                producto.getNombre(), stockActual, cantidadPedida));
            }

            // JPA dirty-checking persistirá este cambio al confirmar la transacción.
            producto.setStockQuantity(stockActual - cantidadPedida);
        }
    }
}
