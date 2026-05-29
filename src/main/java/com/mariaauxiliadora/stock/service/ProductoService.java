package com.mariaauxiliadora.stock.service;

import com.mariaauxiliadora.stock.dto.ProductoRequest;
import com.mariaauxiliadora.stock.entity.Producto;
import com.mariaauxiliadora.stock.exception.RecursoNoEncontradoException;
import com.mariaauxiliadora.stock.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Lógica de negocio para el catálogo de productos.
 */
@Service
public class ProductoService {

    private final ProductoRepository productoRepository;

    public ProductoService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    @Transactional(readOnly = true)
    public List<Producto> listarProductos() {
        return productoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Producto obtenerProducto(Long id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado: " + id));
    }

    @Transactional
    public Producto crearProducto(ProductoRequest request) {
        Producto producto = new Producto();
        aplicarRequest(producto, request);
        return productoRepository.save(producto);
    }

    @Transactional
    public Producto actualizarProducto(Long id, ProductoRequest request) {
        Producto producto = obtenerProducto(id);
        aplicarRequest(producto, request);
        return productoRepository.save(producto);
    }

    @Transactional
    public void eliminarProducto(Long id) {
        if (!productoRepository.existsById(id)) {
            throw new RecursoNoEncontradoException("Producto no encontrado: " + id);
        }

        productoRepository.deleteById(id);
    }

    private void aplicarRequest(Producto producto, ProductoRequest request) {
        producto.setNombre(request.getNombre());
        producto.setDescripcion(request.getDescripcion());
        producto.setPrecio(request.getPrecio());
        producto.setStockQuantity(request.getStockQuantity());
        producto.setFotos(request.getFotos());
        producto.setCaracteristicas(request.getCaracteristicas());
    }
}