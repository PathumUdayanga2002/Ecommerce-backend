package com.ecommerce.cart.service;


import com.ecommerce.cart.common.CartSummeryResponse;
import com.ecommerce.cart.common.ErrorOrderResponse;
import com.ecommerce.cart.common.OrderResponse;
import com.ecommerce.cart.common.SuccessOrderResponse;
import com.ecommerce.cart.dto.CartDTO;
import com.ecommerce.cart.model.Cart;
import com.ecommerce.cart.repo.CartRepo;
import com.ecommerce.product.dto.ProductDTO;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CartService {
    private final WebClient inventoryWebClient;
    private final WebClient productWebClient;

    @Autowired
    private CartRepo cartRepo;

    @Autowired
    private ModelMapper modelMapper;

    public CartService(WebClient inventoryWebClient, WebClient productWebClient, CartRepo cartRepo, ModelMapper modelMapper) {
        this.inventoryWebClient = inventoryWebClient;
        this.productWebClient = productWebClient;
        this.cartRepo = cartRepo;
        this.modelMapper = modelMapper;
    }

    public List<CartDTO> getAllOrders() {
        List<Cart>orderList = cartRepo.findAll();
        return modelMapper.map(orderList, new TypeToken<List<CartDTO>>(){}.getType());
    }

    public OrderResponse saveCart(CartDTO CartDTO) {

        int productId = CartDTO.getProductId();


        try {
            ProductDTO productResponse = productWebClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/product/{productId}").build(productId))
                    .retrieve()
                    .bodyToMono(ProductDTO.class)
                    .block();

            if (productResponse == null) {
                return new ErrorOrderResponse("Product not found Product response null");
            }

            int price = productResponse.getPrice();
            String productName = productResponse.getProductName();
            int quantity= CartDTO.getQuantity();
            if (productId != 0 ) {
                if (quantity!=0 && quantity>0){
                    int totalPrice=price*quantity;
                    CartDTO.setProductName(productName);
                    CartDTO.setTotalPrice(totalPrice);

                    cartRepo.save(modelMapper.map(CartDTO, Cart.class));
                        return new SuccessOrderResponse(CartDTO);
                }else {
                    return new ErrorOrderResponse("Please enter the valid Quantity");
                }

            }else {
                return new ErrorOrderResponse("Please enter the valid product id");
            }
        }
        catch (WebClientResponseException e) {
            if (e.getStatusCode().is5xxServerError()) {
                return new ErrorOrderResponse("Item not found");
            }
        }

        return null;
    }

    public CartSummeryResponse getCartSummery() {
        List<Cart> cartList = cartRepo.findAll();

        List<CartDTO> cartDTOList=cartList.stream().map(cart -> modelMapper.map(cart,CartDTO.class))
                .collect(Collectors.toList());
        int totalCartPrice=cartDTOList.stream()
                .mapToInt(CartDTO::getTotalPrice)
                .sum();
        return new CartSummeryResponse(cartDTOList,totalCartPrice);
    }


    public CartDTO updateCart(CartDTO CartDTO) {
        cartRepo.save(modelMapper.map(CartDTO, Cart.class));
        return CartDTO;
    }

    public String deleteCart(Integer cartId) {
            cartRepo.deleteById(cartId);
        return "Cart Item deleted";
    }

    public CartDTO getCartItemById(Integer cartId) {
        Cart cartItem = cartRepo.getCartById(cartId);
        return modelMapper.map(cartItem, CartDTO.class);
    }

    public String clearCart() {
        cartRepo.deleteAll();
        return "Cart Items cleared";
    }
}
