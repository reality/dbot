## DNS 

Performs and reports upon basic DNS functions.

### Description

This module utilises the domain name system to discover basic information about
domain names and IP addresses.

### Commands

#### ~lookup [domain name]
Looks up the specified domain name in the domain name system. If a match is found,
the first corresponding A or AAAA record is displayed.
#### ~rdns [IP address]
Looks up the specified IP address in the domain name system. If a match is found,
the first corresponding rDNS domain name is displayed.
