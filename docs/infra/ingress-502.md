# Ingress 502 Errors - Infrastructure Recommendations

## Problem Overview

The Spiread application experiences persistent HTTP 502 Bad Gateway errors when accessed through the external Kubernetes ingress route (`https://read-faster-2.preview.emergentagent.com`). Local testing on `localhost:3000` works perfectly, indicating the issue is at the infrastructure level.

## Root Causes

### 1. Kubernetes Ingress Configuration
- **Proxy Timeouts**: Default nginx ingress timeouts are too short for AI/LLM operations
- **Buffer Sizes**: Insufficient buffers for large AI response payloads
- **Keep-Alive Settings**: Connection pooling not optimized for persistent connections

### 2. Backend Service Timeouts
- **AI Endpoints**: `/api/ai/*` routes can take 10-30 seconds for LLM processing
- **Game Sessions**: Long-running game sessions may exceed proxy limits
- **Database Operations**: Complex gamification calculations may timeout

### 3. Load Balancer Configuration
- **Health Checks**: May be hitting wrong endpoints or timing out
- **Session Affinity**: Not configured for stateful game sessions
- **SSL Termination**: Certificate or TLS configuration issues

## Recommended Solutions

### Nginx Ingress Configuration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: spiread-ingress
  annotations:
    # Increase proxy timeouts for AI operations
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60" 
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
    
    # Buffer configuration for large responses
    nginx.ingress.kubernetes.io/proxy-buffer-size: "16k"
    nginx.ingress.kubernetes.io/proxy-buffers-number: "8"
    
    # Keep-alive for performance
    nginx.ingress.kubernetes.io/upstream-keepalive-timeout: "60"
    nginx.ingress.kubernetes.io/upstream-keepalive-requests: "100"
    
    # Body size for file uploads
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    
    # Custom error pages
    nginx.ingress.kubernetes.io/custom-http-errors: "502,503,504"
spec:
  rules:
  - host: brain-trainer-5.preview.emergentagent.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: spiread-service
            port:
              number: 3000
```

### Service Configuration

```yaml
apiVersion: v1
kind: Service
metadata:
  name: spiread-service
spec:
  selector:
    app: spiread
  ports:
  - name: http
    port: 3000
    targetPort: 3000
    protocol: TCP
  type: ClusterIP
  sessionAffinity: ClientIP  # For stateful game sessions
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 3600  # 1 hour session persistence
```

### Deployment Health Checks

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: spiread-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: spiread
  template:
    metadata:
      labels:
        app: spiread
    spec:
      containers:
      - name: spiread
        image: spiread:latest
        ports:
        - containerPort: 3000
        # Proper health checks
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        # Resource limits to prevent OOM kills
        resources:
          limits:
            memory: "1Gi"
            cpu: "500m"
          requests:
            memory: "512Mi"
            cpu: "250m"
```

## Alternative Solutions

### 1. Vercel Deployment
If Kubernetes issues persist, consider Vercel deployment:

```json
// vercel.json
{
  "functions": {
    "app/api/**/*.js": {
      "maxDuration": 60
    },
    "app/api/ai/**/*.js": {
      "maxDuration": 300
    }
  },
  "routes": [
    {
      "src": "/api/ai/(.*)",
      "dest": "/api/ai/$1",
      "headers": {
        "Cache-Control": "s-maxage=0"
      }
    }
  ]
}
```

### 2. API Gateway with Circuit Breaker
Implement circuit breaker pattern for AI endpoints:

```javascript
// lib/circuit-breaker.js
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failures = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

### 3. Async Queue for AI Operations
Implement background processing for heavy AI operations:

```javascript
// lib/ai-queue.js
import Queue from 'bull';

const aiQueue = new Queue('AI processing');

aiQueue.process('summarize', async (job) => {
  const { docId, text, locale } = job.data;
  // Process AI request
  return await generateSummary(text, locale);
});

// In API route
export default async function handler(req, res) {
  const job = await aiQueue.add('summarize', {
    docId: req.body.docId,
    text: req.body.text,
    locale: req.body.locale
  });
  
  res.json({ jobId: job.id, status: 'queued' });
}
```

## Monitoring & Diagnostics

### 1. Logging Configuration
Add comprehensive logging to identify bottlenecks:

```javascript
// lib/logger.js
import winston from 'winston';

export const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: '/var/log/spiread/error.log',
      level: 'error'
    }),
    new winston.transports.File({ 
      filename: '/var/log/spiread/combined.log' 
    })
  ]
});
```

### 2. Performance Metrics
Track key metrics:

```javascript
// lib/metrics.js
export const metrics = {
  requestDuration: new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status']
  }),
  
  aiRequestDuration: new prometheus.Histogram({
    name: 'ai_request_duration_seconds',
    help: 'Duration of AI requests in seconds',
    labelNames: ['operation', 'provider']
  })
};
```

### 3. Health Check Enhancements

```javascript
// app/api/health/route.js
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    ai: await checkAI(),
    memory: process.memoryUsage(),
    uptime: process.uptime()
  };
  
  const healthy = Object.values(checks).every(check => 
    typeof check === 'boolean' ? check : check.status === 'ok'
  );
  
  return Response.json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks
  }, {
    status: healthy ? 200 : 503
  });
}
```

## Action Items

### Immediate (Infrastructure Team)
1. Apply nginx ingress timeout configurations
2. Configure proper health checks
3. Set up monitoring and alerting
4. Review resource limits and requests

### Short Term (Development Team)
1. Implement circuit breaker for AI endpoints
2. Add comprehensive logging and metrics
3. Create fallback responses for timeout scenarios
4. Optimize database queries for performance

### Long Term (Architecture)
1. Consider microservices architecture for AI operations
2. Implement async processing for heavy operations
3. Set up CDN for static assets
4. Plan for horizontal scaling

## Testing Infrastructure Changes

```bash
# Test ingress timeouts
curl -w "@curl-format.txt" \
  -o /dev/null -s \
  "https://read-faster-2.preview.emergentagent.com/api/health"

# Load test with concurrent connections
ab -n 1000 -c 10 \
  "https://read-faster-2.preview.emergentagent.com/api/health"

# Test AI endpoint resilience
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"docId":"test","text":"Long text...","locale":"es"}' \
  "https://read-faster-2.preview.emergentagent.com/api/ai/summarize"
```

## Conclusion

The 502 errors are primarily infrastructure-related and require coordination between development and operations teams. The application code is sound based on local testing. Focus should be on nginx ingress configuration, health checks, and proper monitoring to identify and resolve the root cause.