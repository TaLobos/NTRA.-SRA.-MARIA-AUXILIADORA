package com.mariaauxiliadora.stock.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Usuario registrado en el sistema (ADMIN o CLIENTE).
 */
@Entity
@Table(name = "usuarios")
public class Usuario {

    public enum Rol { ADMIN, CLIENTE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String nombre;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String apellido;

    @Column(length = 255)
    private String organizacion;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String pais;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String provincia;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String ciudad;

    @NotBlank
    @Column(nullable = false, length = 255)
    private String direccion;

    @NotBlank
    @Column(name = "codigo_postal", nullable = false, length = 20)
    private String codigoPostal;

    @Email
    @NotBlank
    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(length = 30)
    private String telefono;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10,
            columnDefinition = "rol_usuario")
    private Rol rol = Rol.CLIENTE;

    // ── Constructors ──────────────────────────────────────────────────────────

    public Usuario() {}

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public Long getId() { return id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }

    public String getOrganizacion() { return organizacion; }
    public void setOrganizacion(String organizacion) { this.organizacion = organizacion; }

    public String getPais() { return pais; }
    public void setPais(String pais) { this.pais = pais; }

    public String getProvincia() { return provincia; }
    public void setProvincia(String provincia) { this.provincia = provincia; }

    public String getCiudad() { return ciudad; }
    public void setCiudad(String ciudad) { this.ciudad = ciudad; }

    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }

    public String getCodigoPostal() { return codigoPostal; }
    public void setCodigoPostal(String codigoPostal) { this.codigoPostal = codigoPostal; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public Rol getRol() { return rol; }
    public void setRol(Rol rol) { this.rol = rol; }
}
