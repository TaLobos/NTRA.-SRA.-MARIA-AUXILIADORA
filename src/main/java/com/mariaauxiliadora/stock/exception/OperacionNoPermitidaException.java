package com.mariaauxiliadora.stock.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Lanzada cuando una operación rompe una regla de negocio del dominio.
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class OperacionNoPermitidaException extends RuntimeException {

    public OperacionNoPermitidaException(String message) {
        super(message);
    }
}