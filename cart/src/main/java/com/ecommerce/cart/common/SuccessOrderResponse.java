package com.ecommerce.cart.common;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.ecommerce.cart.dto.CartDTO;
import lombok.Getter;

@Getter
public class SuccessOrderResponse implements OrderResponse {
    @JsonUnwrapped
    private final CartDTO order;

    public SuccessOrderResponse(CartDTO order) {
        this.order = order;
    }
}
