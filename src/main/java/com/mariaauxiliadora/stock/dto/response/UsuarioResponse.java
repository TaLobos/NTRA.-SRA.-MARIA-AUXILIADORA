package com.mariaauxiliadora.stock.dto.response;

import com.mariaauxiliadora.stock.entity.Usuario;

/**
 * Vista completa de un usuario para la API.
 */
public class UsuarioResponse {

    private Long id;
    private String nombre;
    private String apellido;
    private String organizacion;
    private String pais;
    private String provincia;
    private String ciudad;
    private String direccion;
    private String codigoPostal;
    private String email;
    private String telefono;
    private Usuario.Rol rol;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public Usuario.Rol getRol() { return rol; }
    public void setRol(Usuario.Rol rol) { this.rol = rol; }
}
