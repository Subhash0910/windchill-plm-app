package com.windchill.api.controller;

import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.common.enums.StatusEnum;
import com.windchill.domain.entity.Product;
import com.windchill.service.product.IProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(APIConstants.API_PRODUCTS)
@RequiredArgsConstructor
@Slf4j
public class ProductController {
    private final IProductService productService;

    @PostMapping
    public ResponseEntity<ApiResponse<?>> createProduct(@RequestBody Product product) {
        log.info("Creating new product: {}", product.getProductCode());
        Product createdProduct = productService.createProduct(product);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.builder()
                        .success(true)
                        .message(APIConstants.CREATED)
                        .data(createdProduct)
                        .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> getProductById(@PathVariable Long id) {
        log.info("Fetching product by id: {}", id);
        Product product = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message(APIConstants.SUCCESS)
                .data(product)
                .build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAllProducts() {
        log.info("Fetching all products");
        List<Product> products = productService.getAllProducts();
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message(APIConstants.SUCCESS)
                .data(products)
                .build());
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ApiResponse<?>> getProductByCode(@PathVariable String code) {
        log.info("Fetching product by code: {}", code);
        Product product = productService.getProductByCode(code);
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message(APIConstants.SUCCESS)
                .data(product)
                .build());
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<ApiResponse<?>> getProductsByProject(@PathVariable Long projectId) {
        log.info("Fetching products for project: {}", projectId);
        List<Product> products = productService.getProductsByProject(projectId);
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message(APIConstants.SUCCESS)
                .data(products)
                .build());
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<?>> searchProducts(@RequestParam String keyword) {
        log.info("Searching products with keyword: {}", keyword);
        List<Product> products = productService.searchProducts(keyword);
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message(APIConstants.SUCCESS)
                .data(products)
                .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> updateProduct(@PathVariable Long id, @RequestBody Product productDetails) {
        log.info("Updating product: {}", id);
        Product updatedProduct = productService.updateProduct(id, productDetails);
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message(APIConstants.UPDATED)
                .data(updatedProduct)
                .build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<?>> updateProductStatus(@PathVariable Long id, @RequestParam StatusEnum status) {
        log.info("Updating product status: {} to {}", id, status);
        Product updatedProduct = productService.updateProductStatus(id, status);
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message(APIConstants.UPDATED)
                .data(updatedProduct)
                .build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> deleteProduct(@PathVariable Long id) {
        log.info("Deleting product: {}", id);
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message(APIConstants.DELETED)
                .data(null)
                .build());
    }
}
