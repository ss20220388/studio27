package com.server.studio27.config;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

import java.io.IOException;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;
import java.util.Set;

/**
 * Banka pogadja /api/payment/notify, /success, /failure i /return direktno
 * (cross-site form POST / server-to-server), i uvek salje "Origin" header
 * koji nikad nece biti na nasoj whitelisti (ne znamo unapred tacan domen
 * bankinog gateway-a, i ne bi ni trebalo da ga stavljamo tamo).
 *
 * Umesto da se oslanjamo na to da se Spring Security-jev CorsFilter i
 * Spring MVC-ov CorsInterceptor slazu oko toga koje pravilo "pobedjuje"
 * (sto se u praksi pokazalo nepouzdano), ovaj filter se izvrsava PRE svega
 * ostalog (Ordered.HIGHEST_PRECEDENCE, van Spring Security filter chain-a)
 * i za tih tacno 4 putanje UKLANJA Origin/Referer header iz zahteva pre
 * nego sto ijedan Spring mehanizam stigne da ga pogleda. Bez Origin
 * header-a, ni Security ni MVC CORS provera se uopste ne aktiviraju —
 * zahtev prolazi kao obican isti-origin poziv, sto je tacno ono sto nam
 * treba (bankin odgovor korisnikovom browseru ionako ne zavisi ni od
 * kakvog Access-Control-* header-a — to je bitno samo za JS fetch/XHR,
 * ne za top-level navigaciju/redirect koju banka radi).
 */
@Configuration
public class PaymentOriginBypassFilterConfig {

    private static final Set<String> BANK_PATH_SUFFIXES = Set.of(
            "/payment/notify",
            "/payment/success",
            "/payment/failure",
            "/payment/return"
    );

    @Bean
    public FilterRegistrationBean<Filter> paymentOriginBypassFilter() {
        FilterRegistrationBean<Filter> registration = new FilterRegistrationBean<>();
        registration.setFilter(new PaymentOriginBypassFilter());
        registration.addUrlPatterns("/api/payment/*");
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }

    static class PaymentOriginBypassFilter implements Filter {

        @Override
        public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
                throws IOException, ServletException {

            HttpServletRequest httpRequest = (HttpServletRequest) request;
            String path = httpRequest.getRequestURI();

            boolean isBankPath = BANK_PATH_SUFFIXES.stream().anyMatch(path::endsWith);

            if (isBankPath) {
                chain.doFilter(new OriginStrippingRequestWrapper(httpRequest), response);
            } else {
                chain.doFilter(request, response);
            }
        }
    }

    static class OriginStrippingRequestWrapper extends HttpServletRequestWrapper {

        OriginStrippingRequestWrapper(HttpServletRequest request) {
            super(request);
        }

        private boolean isStripped(String name) {
            return "Origin".equalsIgnoreCase(name) || "Referer".equalsIgnoreCase(name);
        }

        @Override
        public String getHeader(String name) {
            if (isStripped(name)) {
                return null;
            }
            return super.getHeader(name);
        }

        @Override
        public Enumeration<String> getHeaders(String name) {
            if (isStripped(name)) {
                return Collections.emptyEnumeration();
            }
            return super.getHeaders(name);
        }

        @Override
        public Enumeration<String> getHeaderNames() {
            List<String> names = Collections.list(super.getHeaderNames());
            names.removeIf(n -> n.equalsIgnoreCase("Origin") || n.equalsIgnoreCase("Referer"));
            return Collections.enumeration(names);
        }
    }
}