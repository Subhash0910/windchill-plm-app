package com.windchill.service.product;

import com.windchill.common.exceptions.BusinessException;
import com.windchill.common.exceptions.ResourceNotFoundException;
import com.windchill.common.enums.StatusEnum;
import com.windchill.domain.entity.Product;
import com.windchill.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProductServiceImpl implements IProductService {
    private final ProductRepository productRepository;

    @Override
    public Product createProduct(Product product) {
        log.info("Creating new product: {}", product.getProductCode());

        if (product.getProductCode() == null || product.getProductCode().isEmpty()) {
            throw new BusinessException("Product code cannot be empty");
        }

        Product existingProduct = productRepository.findByProductCode(product.getProductCode()).orElse(null);
        if (existingProduct != null && !existingProduct.getIsDeleted()) {
            throw new BusinessException("Product code already exists: " + product.getProductCode());
        }

        product.setIsDeleted(false);
        Product savedProduct = productRepository.save(product);
        log.info("Product created successfully: {}", product.getProductCode());
        return savedProduct;
    }

    @Override
    @Transactional(readOnly = true)
    public Product getProductById(Long id) {
        log.debug("Fetching product by id: {}", id);
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
    }

    @Override
    @Transactional(readOnly = true)
    public Product getProductByCode(String productCode) {
        log.debug("Fetching product by code: {}", productCode);
        return productRepository.findByProductCode(productCode)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "code", productCode));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> getAllProducts() {
        log.debug("Fetching all products");
        return productRepository.findAllActive();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> getProductsByProject(Long projectId) {
        log.debug("Fetching products for project: {}", projectId);
        return productRepository.findByProjectIdAndIsDeletedFalse(projectId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> getProductsByStatus(StatusEnum status) {
        log.debug("Fetching products by status: {}", status);
        return productRepository.findByStatusAndIsDeletedFalse(status);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> searchProducts(String keyword) {
        log.debug("Searching products with keyword: {}", keyword);
        return productRepository.findByProductNameContaining(keyword);
    }

    @Override
    public Product updateProduct(Long id, Product productDetails) {
        log.info("Updating product: {}", id);
        Product product = getProductById(id);

        if (productDetails.getProductName() != null) {
            product.setProductName(productDetails.getProductName());
        }
        if (productDetails.getDescription() != null) {
            product.setDescription(productDetails.getDescription());
        }
        if (productDetails.getCategory() != null) {
            product.setCategory(productDetails.getCategory());
        }
        if (productDetails.getManufacturer() != null) {
            product.setManufacturer(productDetails.getManufacturer());
        }
        if (productDetails.getCost() != null) {
            product.setCost(productDetails.getCost());
        }
        if (productDetails.getSellingPrice() != null) {
            product.setSellingPrice(productDetails.getSellingPrice());
        }
        if (productDetails.getQuantityOnHand() != null) {
            product.setQuantityOnHand(productDetails.getQuantityOnHand());
        }

        Product updatedProduct = productRepository.save(product);
        log.info("Product updated successfully: {}", id);
        return updatedProduct;
    }

    @Override
    public void deleteProduct(Long id) {
        log.info("Deleting product: {}", id);
        Product product = getProductById(id);
        product.setIsDeleted(true);
        productRepository.save(product);
        log.info("Product deleted successfully: {}", id);
    }

    @Override
    public Product updateProductStatus(Long id, StatusEnum status) {
        log.info("Updating product status: {} to {}", id, status);
        Product product = getProductById(id);
        product.setStatus(status);
        return productRepository.save(product);
    }

    @Override
    public Product updateProductVersion(Long id, String newVersion) {
        log.info("Updating product version: {} to {}", id, newVersion);
        Product product = getProductById(id);
        product.setVersionNumber(newVersion);
        return productRepository.save(product);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> getProductsByCategory(String category) {
        log.debug("Fetching products by category: {}", category);
        return productRepository.findByProductNameContaining(category);
    }
}
