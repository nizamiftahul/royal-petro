SELECT DISTINCT tval.id_arrival,
    -- sum(vtscr.tonnage_convert) AS tonnage_handled_ds,
    sum(
        CASE
            WHEN (tval.tonnage IS NULL) THEN 0
            WHEN (tval.start_tonnage IS NULL) THEN tval.tonnage
            ELSE (tval.tonnage - tval.start_tonnage)
        END
    ) AS tonnage_sum,
    sum(
        CASE
            WHEN ((tval.conv_end - tval.conv_start) IS NULL) THEN 0
            ELSE (tval.conv_end - tval.conv_start)
        END
    ) AS th_weigher,
    sum(
        CASE
            WHEN ((tval.dt_end - tval.dt_start) IS NULL) THEN 0
            ELSE (tval.dt_end - tval.dt_start)
        END
    ) AS rit_ops,
    CASE
        WHEN (tvcp.emkl_cost = (0)::double precision) THEN sum(tvcp.tonnage_convert)
        WHEN (tvcp.emkl_cost IS NULL) THEN (0)::double precision
        ELSE (0)::double precision
    END AS th_conv_ds,
    CASE
        WHEN (tvcp.emkl_cost > (0)::double precision) THEN sum(tvcp.tonnage_convert)
        WHEN (tvcp.emkl_cost IS NULL) THEN (0)::double precision
        ELSE (0)::double precision
    END AS th_dt_wsbm,
    CASE
        WHEN (tvcph.rit IS NULL) THEN (0)::bigint
        WHEN (tvcph.rit <> 0) THEN sum(tvcph.rit)
        ELSE NULL::bigint
    END AS rit_wsbm,
    count(
        CASE
            WHEN (tval.id_activity = 5) THEN tval.id_activity
            ELSE NULL::integer
        END
    ) AS breakdown_freq,
    sum(
        (
            date_part('epoch'::text, (tval.end_time - tval.start_time)) / (3600)::double precision
        )
    ) AS total_time,
    CASE
        WHEN (tval.id_activity = 1) THEN sum(
            (
                date_part('epoch'::text, (tval.end_time - tval.start_time)) / (3600)::double precision
            )
        )
        WHEN (tval.id_activity <> 1) THEN (0)::double precision
        ELSE NULL::double precision
    END AS discharging_time,
    CASE
        WHEN (tval.id_activity = 3) THEN sum(
            (
                date_part('epoch'::text, (tval.end_time - tval.start_time)) / (3600)::double precision
            )
        )
        WHEN (tval.id_activity <> 3) THEN (0)::double precision
        ELSE NULL::double precision
    END AS standby_time,
    CASE
        WHEN (tval.id_activity = 5) THEN sum(
            (
                date_part('epoch'::text, (tval.end_time - tval.start_time)) / (3600)::double precision
            )
        )
        WHEN (tval.id_activity <> 5) THEN (0)::double precision
        ELSE NULL::double precision
    END AS breakdown_time,
    CASE
        WHEN (tval.id_activity = 38) THEN sum(
            (
                date_part('epoch'::text, (tval.end_time - tval.start_time)) / (3600)::double precision
            )
        )
        WHEN (tval.id_activity <> 38) THEN (0)::double precision
        ELSE NULL::double precision
    END AS osm_time,
    max(tvcp.emkl_cost) AS emkl_cost,
    min(tval.start_time) AS date1,
    SUM(
        CASE
            WHEN tval.tonnage IS NULL THEN 0 -- WHEN tval.start_tonnage IS NULL THEN tval.tonnage
            ELSE tval.tonnage - tval.start_tonnage
        END
    ) as tonnage_handled,
    -- vtscr.tonnage_convert as tonnage_handled_ds
    -- sum(
    --     CASE
    --         WHEN (tval.tonnage IS NULL) THEN 0
    --         WHEN (tval.start_tonnage IS NULL) THEN tval.tonnage
    --         ELSE (tval.tonnage - tval.start_tonnage)
    --     END
    -- ) - (
    --     CASE
    --         WHEN SUM(
    --             CASE
    --                 WHEN tval.tonnage IS NULL THEN 0
    --                 WHEN tval.start_tonnage IS NULL THEN tval.tonnage
    --                 ELSE tval.tonnage - tval.start_tonnage
    --             END
    --         ) * sum(
    --             CASE
    --                 WHEN (tval.tonnage IS NULL) THEN 0
    --                 WHEN (tval.start_tonnage IS NULL) THEN tval.tonnage
    --                 ELSE (tval.tonnage - tval.start_tonnage)
    --             END
    --         ) = 0 THEN 0
    --         ELSE (
    --             SUM(
    --                 CASE
    --                     WHEN tval.tonnage IS NULL THEN 0
    --                     WHEN tval.start_tonnage IS NULL THEN tval.tonnage
    --                     ELSE tval.tonnage - tval.start_tonnage
    --                 END
    --             ) - vtscr.tonnage_convert
    --         ) / SUM(
    --             CASE
    --                 WHEN tval.tonnage IS NULL THEN 0
    --                 WHEN tval.start_tonnage IS NULL THEN tval.tonnage
    --                 ELSE tval.tonnage - tval.start_tonnage
    --             END
    --         ) * sum(
    --             CASE
    --                 WHEN (tval.tonnage IS NULL) THEN 0
    --                 WHEN (tval.start_tonnage IS NULL) THEN tval.tonnage
    --                 ELSE (tval.tonnage - tval.start_tonnage)
    --             END
    --         )
    --     END
    -- ) AS summary_tonnage_convert_ds
FROM (
        (
            (
                (
                    t_vessel_arrival_logsheet tval
                    JOIN t_vessel_arrival tva ON ((tva.id = tval.id_arrival))
                ) -- JOIN v_tonnage_summary_cover_report vtscr ON vtscr.id_arrival = tval.id_arrival
                JOIN t_vessel_cargo tvc ON ((tvc.id_arrival = tval.id_arrival))
            )
            JOIN t_vessel_cargo_productivity tvcp ON ((tvcp.id_vessel_cargo = tvc.id))
        )
        JOIN t_vessel_cargo_productivity_hatch tvcph ON ((tvcph.id_productivity = tvcp.id))
    )
GROUP BY tval.id_arrival,
    tval.id_activity,
    tvcp.emkl_cost,
    tvcph.rit,
    tval.start_time