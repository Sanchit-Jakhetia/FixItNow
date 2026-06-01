package fixitnow.backend.service;

import fixitnow.backend.dto.LoginRequest;
import fixitnow.backend.dto.RegisterRequest;
import fixitnow.backend.model.User;
import fixitnow.backend.repository.UserRepository;
import fixitnow.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // Register: save user only (Customer/Admin)
    public User register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setLocation(request.getLocation());

        return userRepository.save(user);
    }

    // Login: validate and return JWT token with role
    public String login(LoginRequest request) {
         User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("User not found with this email"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        return jwtUtil.generateToken(user.getEmail(), user.getRole().name());
    }
}

