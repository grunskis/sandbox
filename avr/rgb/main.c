#include <avr/io.h>
#include <avr/interrupt.h>
#include <avr/sleep.h>
#include <util/delay.h>

#define RED_PIN   PB3
#define GREEN_PIN PB0
#define BLUE_PIN  PB4

#define SWITCH_PIN PB2

volatile uint8_t ticks = 0;
volatile uint8_t prev_ticks = 0;
volatile uint8_t state = 0;
volatile uint8_t i = 0;

uint8_t s1[] = { RED_PIN, GREEN_PIN, BLUE_PIN };
uint8_t s2[] = { BLUE_PIN, RED_PIN, GREEN_PIN };

int main(void) {
  // configure output
  DDRB = _BV(RED_PIN) | _BV(GREEN_PIN) | _BV(BLUE_PIN);

  // enable counter1 overflow int
  TIMSK |= _BV(TOIE1);
  TCCR1 |= _BV(CS13) | _BV(CS10); // ticks overflow each ~0.065536 seconds
  
  // enable external interrupt (used by switch)
  GIMSK |= _BV(INT0);
  PORTB |= _BV(SWITCH_PIN); // enable pull-up on switch pin
  
  sei(); // enable interrupts

  while (1) {
    sleep_mode();
  }

  return 0;
}

ISR(TIMER1_OVF_vect) {
  ticks++;

  if (state) {
    PORTB &= ~(_BV(s2[i]));
    PORTB |= _BV(s1[i]);
    
    i++;
    if (i > 2) {
      i = 0;
    }
  }
}

ISR(INT0_vect) {
  if (ticks < prev_ticks)
    prev_ticks = ticks;
  
  if (prev_ticks + 2 >= ticks)
    return;
  
  if (state) {
    state = 0;
    
    PORTB &= ~(_BV(s2[i]));
  } else {
    state = 1;
  }

  prev_ticks = ticks;
}
