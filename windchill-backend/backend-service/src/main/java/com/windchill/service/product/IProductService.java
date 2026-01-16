package com.windchill.service.product;

import com.windchill.domain.entity.Product;
import com.windchill.common.enums.StatusEnum;

import java.util.List;
import java.util.Optional;

public interface IProductService {
    Product createProduct(Product product);
    
    Product getProductById(Long id);
    
    Product getProductByCode(String productCode);
    
    List<Product> getAllProducts();
    
    List<Product> getProductsByProject(Long projectId);
    
    List<Product> getProductsByStatus(StatusEnum status);
    
    List<Product> searchProducts(String keyword);
    
    Product updateProduct(Long id, Product productDetails);
    
    void deleteProduct(Long id);
    
    Product updateProductStatus(Long id, StatusEnum status);
    
    Product updateProductVersion(Long id, String newVersion);
    
    List<Product> getProductsByCategory(String category);
}
