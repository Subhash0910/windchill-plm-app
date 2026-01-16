package com.windchill.service.user;

import com.windchill.domain.entity.User;
import com.windchill.common.enums.RoleEnum;

import java.util.List;
import java.util.Optional;

public interface IUserService {
    User createUser(String username, String email, String password, RoleEnum role);
    
    User getUserById(Long id);
    
    User getUserByUsername(String username);
    
    Optional<User> findByEmail(String email);
    
    List<User> getAllUsers();
    
    User updateUser(Long id, User userDetails);
    
    void deleteUser(Long id);
    
    User authenticateUser(String username, String password);
    
    void changePassword(Long userId, String oldPassword, String newPassword);
    
    User updateLastLogin(Long userId);
    
    boolean userExists(String username);
}
