#include <avr/io.h>
#include <avr/interrupt.h>
#include <avr/sleep.h>

#define LED_PIN  PB0
#define LDR_PIN  PB3
#define SWITCH_PIN PB2

volatile uint8_t ticks = 0;
volatile uint8_t prev_ticks = 0;
volatile uint8_t state = 0;

// adc
volatile uint8_t measurement_count = 0;
volatile uint16_t sum = 0, avg = 0;

int main(void) {
  // configure output
  DDRB = _BV(LED_PIN);
  PORTB &= ~_BV(LED_PIN);

  // enable counter1 overflow int
  TIMSK |= _BV(TOIE1);
  TCCR1 |= _BV(CS13) | _BV(CS10); // ticks overflow each ~0.065536 seconds
  
  // enable external interrupt (used by switch)
  GIMSK |= _BV(INT0);
  PORTB |= _BV(SWITCH_PIN); // enable pull-up on switch pin

  PORTB |= _BV(LDR_PIN); // enable pull-up on ldr pin
  ADMUX |=
    _BV(REFS1) | // internal 1.1V reference
    _BV(MUX1) | _BV(MUX0); // enable ADC3
  ADCSRA |=
    _BV(ADIE) | // interrupt on conversation complete
    _BV(ADEN) | _BV(ADATE) | // enable & put in auto trigger mode
    _BV(ADPS2); // prescale ADC clock
  
  sei(); // enable interrupts

  while (1) {
    sleep_mode();
  }

  return 0;
}

ISR(TIMER1_OVF_vect) {
  ticks++;
}

ISR(INT0_vect) {
  if (ticks < prev_ticks)
    prev_ticks = ticks;
  
  if (prev_ticks + 1 >= ticks)
    return;

  if (state) {
    state = 0;

    // make sure LEDs are turned off
    PORTB &= ~_BV(LED_PIN);
  } else {
    state = 1;
  }

  prev_ticks = ticks;
}

ISR(ADC_vect) {
  uint8_t low, high;

  if (state == 0) {
    // we don't care about measurements if LEDs are turned off...
    return;
  }
  
  // we have to read ADCL first; doing so locks both ADCL
  // and ADCH until ADCH is read.  reading ADCL second would
  // cause the results of each conversion to be discarded,
  // as ADCL and ADCH would be locked when it completed.
  low = ADCL;
  high = ADCH;

  // combine the two bytes
  sum += ((high << 8) | low);

  if (measurement_count >= 4) {
    avg = (sum / measurement_count);

    if (avg > 300) {
      PORTB |= _BV(LED_PIN);
    } else if (avg < 200) {
      PORTB &= ~_BV(LED_PIN);
    }

    sum = measurement_count = 0;
  } else {
    measurement_count++;
  }
}
