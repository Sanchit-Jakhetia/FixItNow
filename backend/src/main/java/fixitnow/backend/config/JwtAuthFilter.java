package fixitnow.backend.config;

import fixitnow.backend.model.User;
import fixitnow.backend.repository.UserRepository;
import fixitnow.backend.security.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        String token = null;
        String email = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            try {
                email = jwtUtil.extractUsername(token);
            } catch (Exception e) {
                logger.warn("Invalid JWT token: " + e.getMessage());
            }
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            User user = userRepository.findByEmail(email).orElse(null);

            if (user != null && jwtUtil.validateToken(token, user.getEmail())) {
                // Normalize role to uppercase and add ROLE_ prefix
                String roleName = "ROLE_" + user.getRole().name().toUpperCase();
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                user,
                                null,
                                List.of(() -> roleName)
                        );

                SecurityContextHolder.getContext().setAuthentication(authToken);

                // Log for debugging
                logger.info("Authenticated user: " + email + ", role: " + roleName);
                logger.info("Authorities: " + SecurityContextHolder.getContext().getAuthentication().getAuthorities());
            }
        }

        filterChain.doFilter(request, response);
    }
}

