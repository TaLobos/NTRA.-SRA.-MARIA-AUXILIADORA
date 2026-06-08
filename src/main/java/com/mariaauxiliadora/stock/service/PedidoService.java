package com.mariaauxiliadora.stock.service;

import com.mariaauxiliadora.stock.dto.DetallePedidoRequest;
import com.mariaauxiliadora.stock.dto.PedidoRequest;
import com.mariaauxiliadora.stock.entity.DetallePedido;
import com.mariaauxiliadora.stock.entity.Pedido;
import com.mariaauxiliadora.stock.entity.Producto;
import com.mariaauxiliadora.stock.entity.Usuario;
import com.mariaauxiliadora.stock.exception.OperacionNoPermitidaException;
import com.mariaauxiliadora.stock.exception.RecursoNoEncontradoException;
import com.mariaauxiliadora.stock.exception.StockInsuficienteException;
import com.mariaauxiliadora.stock.repository.PedidoRepository;
import com.mariaauxiliadora.stock.repository.ProductoRepository;
import com.mariaauxiliadora.stock.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

    @Transactional(readOnly = true)
    public List<Pedido> listarPedidos() {
        return pedidoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Pedido obtenerPedido(Long pedidoId) {
        return pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Pedido no encontrado: " + pedidoId));
    }

    @Transactional(readOnly = true)
    public List<Pedido> listarPedidosPorUsuario(Long usuarioId) {
        if (!usuarioRepository.existsById(usuarioId)) {
            throw new RecursoNoEncontradoException("Usuario no encontrado: " + usuarioId);
        }
        return pedidoRepository.findByUsuarioId(usuarioId);
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
        Map<Long, Integer> cantidadesPorProducto = agruparCantidades(request.getDetalles());

        for (Map.Entry<Long, Integer> item : cantidadesPorProducto.entrySet()) {
            Producto producto = productoRepository.findById(item.getKey())
                    .orElseThrow(() -> new RecursoNoEncontradoException(
                            "Producto no encontrado: " + item.getKey()));
            int cantidadSolicitada = item.getValue();

            if (producto.getStockQuantity() < cantidadSolicitada) {
                throw new StockInsuficienteException(
                        String.format(
                                "Stock insuficiente para '%s': disponible=%d, solicitado=%d",
                                producto.getNombre(),
                                producto.getStockQuantity(),
                                cantidadSolicitada));
            }

            pedido.addDetalle(new DetallePedido(producto, cantidadSolicitada));
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
        Pedido pedido = obtenerPedido(pedidoId);

        if (pedido.getEstado() != Pedido.Estado.PENDIENTE) {
            throw new OperacionNoPermitidaException(
                    "Solo se puede cambiar el estado de pedidos pendientes");
        }

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

    private Map<Long, Integer> agruparCantidades(List<DetallePedidoRequest> detalles) {
        Map<Long, Integer> cantidadesPorProducto = new LinkedHashMap<>();
        for (DetallePedidoRequest detalle : detalles) {
            cantidadesPorProducto.merge(detalle.getProductoId(), detalle.getCantidad(), Integer::sum);
        }
        return cantidadesPorProducto;
    }
}
