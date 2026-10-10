<?php

namespace App\Services\Payment;

use App\Contracts\PaymentGatewayInterface;
use App\Exceptions\PaymentConfigurationException;
use InvalidArgumentException;

class PaymentManager
{
    protected array $gateways = [];

    /**
     * Resolve a payment gateway by name, or get default configured provider.
     *
     * @param string|null $name
     * @return PaymentGatewayInterface
     */
    public function gateway(?string $name = null): PaymentGatewayInterface
    {
        $name = $name ?: config('pasaria.payment.default', 'sandbox');

        if (!isset($this->gateways[$name])) {
            $this->gateways[$name] = $this->resolve($name);
        }

        return $this->gateways[$name];
    }

    /**
     * Resolve gateway instance.
     */
    protected function resolve(string $name): PaymentGatewayInterface
    {
        return match (strtolower($name)) {
            'sandbox'  => new SandboxPaymentGateway(),
            'midtrans' => new MidtransPaymentGateway(),
            'xendit'   => new XenditPaymentGateway(),
            default    => throw new InvalidArgumentException("Payment gateway '{$name}' tidak didukung."),
        };
    }
}
