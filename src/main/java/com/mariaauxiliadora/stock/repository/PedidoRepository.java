package com.mariaauxiliadora.stock.repository;

import com.mariaauxiliadora.stock.entity.Pedido;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    @Override
    @EntityGraph(attributePaths = {"usuario", "detalles", "detalles.producto"})
    List<Pedido> findAll();

    @Override
    @EntityGraph(attributePaths = {"usuario", "detalles", "detalles.producto"})
    Optional<Pedido> findById(Long id);

    @EntityGraph(attributePaths = {"usuario", "detalles", "detalles.producto"})
    List<Pedido> findByUsuarioId(Long usuarioId);
}
