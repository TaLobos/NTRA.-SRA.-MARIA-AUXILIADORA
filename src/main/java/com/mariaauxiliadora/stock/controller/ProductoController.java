package com.mariaauxiliadora.stock.controller;

import com.mariaauxiliadora.stock.dto.ProductoRequest;
import com.mariaauxiliadora.stock.dto.response.ProductoResponse;
import com.mariaauxiliadora.stock.service.ProductoService;
import com.mariaauxiliadora.stock.service.ApiResponseMapper;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Catálogo de productos visible para clientes y administrado por usuarios ADMIN.
 */
@RestController
@RequestMapping("/api/productos")
public class ProductoController {

    private final ProductoService productoService;
    private final ApiResponseMapper apiResponseMapper;

    public ProductoController(ProductoService productoService, ApiResponseMapper apiResponseMapper) {
        this.productoService = productoService;
        this.apiResponseMapper = apiResponseMapper;
    }

    @GetMapping
    public ResponseEntity<List<ProductoResponse>> listarProductos() {
        return ResponseEntity.ok(apiResponseMapper.toProductoResponseList(productoService.listarProductos()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductoResponse> obtenerProducto(@PathVariable Long id) {
        return ResponseEntity.ok(apiResponseMapper.toProductoResponse(productoService.obtenerProducto(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductoResponse> crearProducto(@Valid @RequestBody ProductoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(apiResponseMapper.toProductoResponse(productoService.crearProducto(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductoResponse> actualizarProducto(@PathVariable Long id,
                                                               @Valid @RequestBody ProductoRequest request) {
        return ResponseEntity.ok(apiResponseMapper.toProductoResponse(productoService.actualizarProducto(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminarProducto(@PathVariable Long id) {
        productoService.eliminarProducto(id);
        return ResponseEntity.noContent().build();
    }
}