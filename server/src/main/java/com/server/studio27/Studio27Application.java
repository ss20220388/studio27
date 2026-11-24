package com.server.studio27;


import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // podsetnici za napuštenu kupovinu (PodsetnikKupovine)
public class Studio27Application {
	public static void main(String[] args)  {
		SpringApplication.run(Studio27Application.class, args);
	}

}
