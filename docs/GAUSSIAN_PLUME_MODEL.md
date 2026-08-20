# 💨 Gaussian Plume Dispersion Model Mathematical Formulation

## 1. Overview
The Gaussian Plume Dispersion Model is the standard mathematical model used by atmospheric scientists and environmental regulatory agencies (such as US EPA and CPCB) to calculate the spatial distribution and concentration profile of continuous and transient atmospheric emissions.

---

## 2. Fundamental Dispersion Equation

For a continuous point source at height $H$ with emission rate $Q$ ($g/s$) and steady-state wind speed $u$ ($m/s$):

$$C(x,y,z) = \frac{Q}{2 \pi u \sigma_y \sigma_z} \exp\left( -\frac{y^2}{2 \sigma_y^2} \right) \left[ \exp\left( -\frac{(z - H)^2}{2 \sigma_z^2} \right) + \exp\left( -\frac{(z + H)^2}{2 \sigma_z^2} \right) \right]$$

Where:
* $C(x,y,z)$ is the concentration at spatial coordinates $(x,y,z)$ in $\mu g/m^3$.
* $x$ is the downwind distance along the mean wind direction.
* $y$ is the crosswind lateral distance perpendicular to the wind axis.
* $z$ is the vertical elevation above ground level.
* $H$ is the effective plume release height.
* $\sigma_y(x)$ and $\sigma_z(x)$ are the standard deviations of the lateral and vertical plume concentration distributions.

---

## 3. Pasquill-Gifford Stability Class Parameterization

The lateral ($\sigma_y$) and vertical ($\sigma_z$) dispersion coefficients are parameterized as power-law functions of downwind distance $x$:

$$\sigma_y(x) = c \cdot x^d$$
$$\sigma_z(x) = a \cdot x^b$$

| Stability Class | Atmospheric Condition | $c$ | $d$ | $a$ | $b$ |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **A** | Extremely Unstable (Strong Solar Heating) | 0.22 | 0.89 | 0.20 | 0.90 |
| **B** | Moderately Unstable | 0.16 | 0.89 | 0.12 | 0.90 |
| **C** | Slightly Unstable | 0.11 | 0.89 | 0.08 | 0.90 |
| **D** | Neutral (Overcast / High Wind) | 0.08 | 0.89 | 0.06 | 0.85 |
| **E** | Slightly Stable (Nighttime / Light Wind) | 0.06 | 0.89 | 0.03 | 0.80 |
| **F** | Moderately Stable (Strong Inversion) | 0.04 | 0.89 | 0.016 | 0.75 |

---

## 4. 2D Spatial Polygon Fan Construction

In VesperAero, the 2D visual plume cone is computed geometrically from the origin coordinate $(\text{lat}_0, \text{lng}_0)$:
1. The **central plume axis** follows the meteorological downwind vector: $\theta_{\text{drift}} = (\theta_{\text{wind}} + 180^\circ) \bmod 360^\circ$.
2. Lateral spread angles are projected at $\pm 2.15 \sigma_y(x)$ (enclosing 96.8% of the hazardous mass).
3. Polygon vertices are generated along geodesic paths using the Haversine forward projection algorithm.
