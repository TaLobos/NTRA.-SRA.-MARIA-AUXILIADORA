package com.mariaauxiliadora.stock.entity;

import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

// NOTE: fecha is set via @PrePersist to ensure the timestamp reflects the actual
// persistence moment (not object instantiation time).

/**
 * Pedido realizado por un cliente registrado.
 */
@Entity
@Table(name = "pedidos")
public class Pedido {

    public enum Estado { PENDIENTE, ACEPTADO, RECHAZADO }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private Estado estado = Estado.PENDIENTE;

    @Column(nullable = false)
    private OffsetDateTime fecha;

    @PrePersist
    protected void onPersist() {
        if (fecha == null) {
            fecha = OffsetDateTime.now();
        }
    }

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetallePedido> detalles = new ArrayList<>();

    // ── Constructors ──────────────────────────────────────────────────────────

    public Pedido() {}

    public Pedido(Usuario usuario) {
        this.usuario = usuario;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public void addDetalle(DetallePedido detalle) {
        detalle.setPedido(this);
        detalles.add(detalle);
    }

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public Long getId() { return id; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public Estado getEstado() { return estado; }
    public void setEstado(Estado estado) { this.estado = estado; }

    public OffsetDateTime getFecha() { return fecha; }
    public void setFecha(OffsetDateTime fecha) { this.fecha = fecha; }

    public List<DetallePedido> getDetalles() { return detalles; }
    public void setDetalles(List<DetallePedido> detalles) { this.detalles = detalles; }
}
