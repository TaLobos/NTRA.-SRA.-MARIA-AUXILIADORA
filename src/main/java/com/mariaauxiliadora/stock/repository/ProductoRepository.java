package com.mariaauxiliadora.stock.repository;

import com.mariaauxiliadora.stock.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {}
