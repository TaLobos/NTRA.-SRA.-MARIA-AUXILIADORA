package com.mariaauxiliadora.stock.repository;

import com.mariaauxiliadora.stock.entity.Producto;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    @Override
    @EntityGraph(attributePaths = {"fotos", "caracteristicas"})
    List<Producto> findAll();

    @Override
    @EntityGraph(attributePaths = {"fotos", "caracteristicas"})
    Optional<Producto> findById(Long id);
}
